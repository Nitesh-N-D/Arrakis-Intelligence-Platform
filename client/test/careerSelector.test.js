import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAREER_ROLES, CUSTOM_ROLE_ID } from "../src/data/careerRoles.js";
import {
  addCustomSkill,
  buildOptions,
  emptySelection,
  nextActiveIndex,
  selectionFromCareer,
  selectionTitle,
  toCareerPayload,
  validateSelection
} from "../src/components/career/careerSelectorModel.js";
import { masteryChecklist } from "../src/components/career/roadmapModel.js";

test("client career catalogue is byte-identical to the server catalogue", () => {
  const client = readFileSync(new URL("../src/data/careerRoles.js", import.meta.url));
  const server = readFileSync(new URL("../../server/src/data/careerRoles.js", import.meta.url));
  assert.equal(Buffer.compare(client, server), 0, "copy server/src/data/careerRoles.js to client/src/data/careerRoles.js");
});

test("search options always end with a custom-role option carrying the query", () => {
  const options = buildOptions("frontend");
  assert.ok(options.length >= 2);
  assert.equal(options[0].type, "role");
  assert.equal(options[0].id, "frontend-developer");
  const last = options.at(-1);
  assert.equal(last.type, "custom");
  assert.equal(last.title, "frontend");

  const none = buildOptions("zzqx underwater basket weaving");
  assert.equal(none.filter((option) => option.type === "role").length, 0);
  assert.equal(none.at(-1).type, "custom");
});

test("category filter narrows options to that category", () => {
  const category = CAREER_ROLES[0].categoryId;
  const roles = buildOptions("", category).filter((option) => option.type === "role");
  assert.ok(roles.length > 0);
  for (const option of roles) {
    assert.equal(CAREER_ROLES.find((role) => role.id === option.id).categoryId, category);
  }
});

test("keyboard navigation wraps and supports Home/End/Page keys", () => {
  assert.equal(nextActiveIndex("ArrowDown", 0, 3), 1);
  assert.equal(nextActiveIndex("ArrowDown", 2, 3), 0);
  assert.equal(nextActiveIndex("ArrowUp", 0, 3), 2);
  assert.equal(nextActiveIndex("Home", 2, 3), 0);
  assert.equal(nextActiveIndex("End", 0, 3), 2);
  assert.equal(nextActiveIndex("PageDown", 0, 20), 5);
  assert.equal(nextActiveIndex("PageUp", 3, 20), 0);
  assert.equal(nextActiveIndex("a", 0, 3), null);
});

test("validation requires a role and checks custom titles", () => {
  assert.ok(validateSelection(emptySelection()).role);
  assert.deepEqual(validateSelection({ ...emptySelection(), roleId: "frontend-developer" }), {});
  assert.ok(validateSelection({ ...emptySelection(), roleId: "not-real" }).role);
  const custom = (customTitle) => validateSelection({ ...emptySelection(), roleId: CUSTOM_ROLE_ID, customTitle });
  assert.ok(custom("x").customTitle);
  assert.ok(custom("<script>").customTitle);
  assert.ok(custom("1234").customTitle);
  assert.ok(custom("R".repeat(81)).customTitle);
  assert.deepEqual(custom("Robotics Software Engineer"), {});
});

test("payload sends only the role id for catalogue roles", () => {
  const payload = toCareerPayload({ ...emptySelection(), roleId: "frontend-developer", targetLevel: "advanced" });
  assert.deepEqual(Object.keys(payload).sort(), ["experienceLevel", "roleId", "targetLevel", "timelineMonths"]);
  assert.equal(selectionTitle({ roleId: "frontend-developer" }), "Frontend Developer");
});

test("custom payload trims and de-duplicates skills", () => {
  let skills = addCustomSkill([], "  Python  ");
  skills = addCustomSkill(skills, "python");
  skills = addCustomSkill(skills, "<b>");
  skills = addCustomSkill(skills, "ROS", "core");
  assert.deepEqual(skills, [{ name: "Python", priority: "important" }, { name: "ROS", priority: "core" }]);
  const payload = toCareerPayload({ ...emptySelection(), roleId: CUSTOM_ROLE_ID, customTitle: "  Robotics   Engineer ", customSkills: skills });
  assert.equal(payload.customTitle, "Robotics Engineer");
  assert.equal(payload.customSkills.length, 2);
});

test("selection round-trips from a serialized server career", () => {
  assert.equal(selectionFromCareer({ roleId: "frontend-developer", title: "Frontend Developer", isCustom: false }).roleId, "frontend-developer");
  const custom = selectionFromCareer({ roleId: "custom", title: "Robotics", isCustom: true, customSkills: [{ name: "ROS" }] });
  assert.equal(custom.roleId, CUSTOM_ROLE_ID);
  assert.equal(custom.customTitle, "Robotics");
  assert.deepEqual(custom.customSkills, [{ name: "ROS", priority: "important" }]);
  assert.equal(selectionFromCareer(null).roleId, null);
});

test("mastery checklist needs every task, evidence and every assessment point", () => {
  const phase = { tasks: ["a", "b"], completedTasks: [0], assessmentCriteria: ["x"], assessmentConfirmed: [], evidence: [] };
  assert.equal(masteryChecklist(phase).ready, false);
  const done = { ...phase, completedTasks: [0, 1, 1, 7], assessmentConfirmed: [0], evidence: [{ summary: "s" }] };
  const result = masteryChecklist(done);
  assert.equal(result.tasks.done, 2);
  assert.equal(result.ready, true);
});
