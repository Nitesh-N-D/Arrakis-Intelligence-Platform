import mongoose from "mongoose";
import { MissionRepository } from "../repositories/MissionRepository.js";
import { GoalRepository } from "../repositories/GoalRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { cleanText } from "./careerProfile.js";

export const MISSION_LIMITS = Object.freeze({ perDay: 30, priorities: 3, maxPlannedMinutes: 480 });
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const statuses = ["todo", "done", "dropped"];

/** Validates a client calendar day. The client sends its local day so "today" follows the user's timezone. */
export function parseDay(value, now = new Date()) {
  if (value === undefined || value === null || value === "") return now.toISOString().slice(0, 10);
  const day = String(value);
  if (!DAY_PATTERN.test(day)) throw new ApiError(400, "Day must use the YYYY-MM-DD format.");
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0, 10) !== day) throw new ApiError(400, "Day is not a valid date.");
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  if (Math.abs(parsed - today) / 86_400_000 > 366) throw new ApiError(400, "Day must be within a year of today.");
  return day;
}

const parseOptionalDate = (value, field) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${field} is not a valid date.`);
  return date;
};

const parseMinutes = (value) => {
  if (value === undefined) return undefined;
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MISSION_LIMITS.maxPlannedMinutes) {
    throw new ApiError(400, `Planned focus must be a whole number between 0 and ${MISSION_LIMITS.maxPlannedMinutes} minutes.`);
  }
  return minutes;
};

const assertObjectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `${label} is invalid.`);
};

export function summarizeMissions(missions = []) {
  const active = missions.filter((mission) => mission.status !== "dropped");
  const done = active.filter((mission) => mission.status === "done");
  const priorities = active.filter((mission) => mission.priority);
  return {
    total: active.length,
    done: done.length,
    priorities: priorities.length,
    prioritiesDone: priorities.filter((mission) => mission.status === "done").length,
    plannedMinutes: active.reduce((sum, mission) => sum + (mission.plannedFocusMinutes || 0), 0),
    completedMinutes: active.reduce((sum, mission) => sum + (mission.completedFocusMinutes || 0), 0),
    progress: active.length ? Math.round((done.length / active.length) * 100) : 0
  };
}

export const serializeMission = (mission) => ({
  id: String(mission._id || mission.id),
  day: mission.day,
  title: mission.title,
  notes: mission.notes || "",
  priority: Boolean(mission.priority),
  status: mission.status,
  dueDate: mission.dueDate || null,
  plannedFocusMinutes: mission.plannedFocusMinutes || 0,
  completedFocusMinutes: mission.completedFocusMinutes || 0,
  focusSessions: mission.focusSessions || 0,
  goalId: mission.goal ? String(mission.goal) : null,
  carriedFrom: mission.carriedFrom || null,
  carryCount: mission.carryCount || 0,
  completedAt: mission.completedAt || null
});

export class MissionService {
  constructor({ missionRepository = new MissionRepository(), goalRepository = new GoalRepository(), clock = () => new Date() } = {}) {
    Object.assign(this, { missionRepository, goalRepository, clock });
  }

  async getBoard(user, query = {}) {
    const day = parseDay(query.day, this.clock());
    const [missions, openBefore] = await Promise.all([
      this.missionRepository.listByDay(user.id, day),
      this.missionRepository.listOpenBefore(user.id, day)
    ]);
    return {
      day,
      missions: missions.map(serializeMission),
      summary: summarizeMissions(missions),
      // Never moved automatically: the user chooses whether unfinished work comes forward.
      carryForward: { count: openBefore.length, items: openBefore.slice(0, 20).map(serializeMission) },
      limits: MISSION_LIMITS
    };
  }

  async assertGoal(user, goalId) {
    if (goalId === undefined) return undefined;
    if (goalId === null || goalId === "") return null;
    assertObjectId(goalId, "Goal ID");
    const goal = await this.goalRepository.findOwned(user.id, goalId);
    if (!goal) throw new ApiError(404, "Goal not found");
    return goal._id;
  }

  async assertPrioritySlot(user, day, excludeId = null) {
    const filter = { priority: true, status: { $ne: "dropped" }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) };
    const priorities = await this.missionRepository.countByDay(user.id, day, filter);
    if (priorities >= MISSION_LIMITS.priorities) {
      throw new ApiError(409, "You already have three priorities for this day. Unmark one first.");
    }
  }

  async create(user, payload = {}) {
    const day = parseDay(payload.day, this.clock());
    const title = cleanText(payload.title, { field: "Mission title", max: 140, min: 1, required: true });
    const notes = cleanText(payload.notes, { field: "Notes", max: 500 });
    const count = await this.missionRepository.countByDay(user.id, day);
    if (count >= MISSION_LIMITS.perDay) throw new ApiError(409, `A day can hold up to ${MISSION_LIMITS.perDay} missions.`);
    const priority = payload.priority === true;
    if (priority) await this.assertPrioritySlot(user, day);
    const mission = await this.missionRepository.create({
      user: user.id,
      day,
      title,
      notes,
      priority,
      dueDate: parseOptionalDate(payload.dueDate, "Due date") ?? null,
      plannedFocusMinutes: parseMinutes(payload.plannedFocusMinutes) ?? 0,
      goal: (await this.assertGoal(user, payload.goalId)) ?? null,
      order: count
    });
    return serializeMission(mission);
  }

  async update(user, missionId, payload = {}) {
    assertObjectId(missionId, "Mission ID");
    const existing = await this.missionRepository.findOwned(user.id, missionId);
    if (!existing) throw new ApiError(404, "Mission not found");
    const set = {};
    if (payload.title !== undefined) set.title = cleanText(payload.title, { field: "Mission title", max: 140, min: 1, required: true });
    if (payload.notes !== undefined) set.notes = cleanText(payload.notes, { field: "Notes", max: 500 });
    if (payload.status !== undefined) {
      if (!statuses.includes(payload.status)) throw new ApiError(400, "Choose a valid mission status.");
      set.status = payload.status;
      set.completedAt = payload.status === "done" ? existing.completedAt || this.clock() : null;
    }
    if (payload.priority !== undefined) {
      const priority = payload.priority === true;
      if (priority && !existing.priority) await this.assertPrioritySlot(user, existing.day, existing._id);
      set.priority = priority;
    }
    const dueDate = parseOptionalDate(payload.dueDate, "Due date");
    if (dueDate !== undefined) set.dueDate = dueDate;
    const planned = parseMinutes(payload.plannedFocusMinutes);
    if (planned !== undefined) set.plannedFocusMinutes = planned;
    const goal = await this.assertGoal(user, payload.goalId);
    if (goal !== undefined) set.goal = goal;
    if (!Object.keys(set).length) return serializeMission(existing);
    return serializeMission(await this.missionRepository.updateOwned(user.id, missionId, { $set: set }));
  }

  async remove(user, missionId) {
    assertObjectId(missionId, "Mission ID");
    const result = await this.missionRepository.deleteOwned(user.id, missionId);
    if (!result?.deletedCount) throw new ApiError(404, "Mission not found");
    return { deleted: true };
  }

  /** Moves the user's unfinished missions from earlier days to `toDay`, only when they ask for it. */
  async carryForward(user, payload = {}) {
    const toDay = parseDay(payload.toDay, this.clock());
    const open = await this.missionRepository.listOpenBefore(user.id, toDay);
    const requested = Array.isArray(payload.missionIds) ? new Set(payload.missionIds.map(String)) : null;
    const selected = open.filter((mission) => !requested || requested.has(String(mission._id)));
    const existingCount = await this.missionRepository.countByDay(user.id, toDay);
    const room = Math.max(0, MISSION_LIMITS.perDay - existingCount);
    const moving = selected.slice(0, room);
    if (moving.length) await this.missionRepository.carryForward(user.id, moving.map((mission) => mission._id), toDay);
    return { moved: moving.length, skipped: selected.length - moving.length, board: await this.getBoard(user, { day: toDay }) };
  }

  /** Validates that a mission the client wants to focus on belongs to this user. */
  async findOwnedMission(user, missionId) {
    if (missionId === undefined || missionId === null || missionId === "") return null;
    assertObjectId(missionId, "Mission ID");
    const mission = await this.missionRepository.findOwned(user.id, missionId);
    if (!mission) throw new ApiError(404, "Mission not found");
    return mission;
  }

  /** Called after a server-verified focus completion; the repository query is scoped to the owner. */
  async recordFocus(userId, missionId, minutes) {
    if (!missionId || !mongoose.isValidObjectId(String(missionId))) return null;
    return this.missionRepository.addFocus(userId, missionId, Math.max(0, Math.round(minutes)));
  }
}
