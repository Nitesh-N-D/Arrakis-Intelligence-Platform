import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Team } from "../src/models/Team.js";
import { User } from "../src/models/User.js";
import { TeamService } from "../src/services/teamService.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
const userIds = [];
const teamIds = [];

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await Promise.all([Team.init(), User.init()]);
});

after(async () => {
  if (!connected) return;
  await Promise.all([
    Team.deleteMany({ _id: { $in: teamIds } }),
    User.deleteMany({ _id: { $in: userIds } })
  ]);
  await disconnectTestReplicaSet();
});

test("concurrent team joins preserve one membership and matching aggregates", async () => {
  const suffix = randomUUID();
  const [firstOwner, secondOwner, member] = await User.create([
    { name: "First Owner", email: `team-a-${suffix}@example.test`, totalSpice: 11, focusStreak: 3 },
    { name: "Second Owner", email: `team-b-${suffix}@example.test`, totalSpice: 13, focusStreak: 4 },
    { name: "Joining Member", email: `team-member-${suffix}@example.test`, totalSpice: 7, focusStreak: 2 }
  ]);
  userIds.push(firstOwner.id, secondOwner.id, member.id);

  const service = new TeamService();
  const [first, second] = await Promise.all([
    service.createTeam(firstOwner, { name: `Sietch A ${suffix}` }),
    service.createTeam(secondOwner, { name: `Sietch B ${suffix}` })
  ]);
  teamIds.push(first.team.id, second.team.id);

  await Promise.all([
    service.joinTeam(member, { teamId: first.team.id }),
    service.joinTeam(member, { teamId: second.team.id })
  ]);

  const [storedMember, firstTeam, secondTeam] = await Promise.all([
    User.findById(member.id),
    Team.findById(first.team.id),
    Team.findById(second.team.id)
  ]);
  const assignedTeamId = String(storedMember.team);
  assert.ok([first.team.id, second.team.id].includes(assignedTeamId));

  for (const team of [firstTeam, secondTeam]) {
    const containsMember = team.members.some((id) => String(id) === member.id);
    assert.equal(containsMember, String(team._id) === assignedTeamId);
  }

  assert.equal(firstTeam.totalSpice, 11 + (assignedTeamId === first.team.id ? 7 : 0));
  assert.equal(secondTeam.totalSpice, 13 + (assignedTeamId === second.team.id ? 7 : 0));
  assert.equal(firstTeam.totalStreak, 3 + (assignedTeamId === first.team.id ? 2 : 0));
  assert.equal(secondTeam.totalStreak, 4 + (assignedTeamId === second.team.id ? 2 : 0));
});
