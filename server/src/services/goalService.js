import mongoose from "mongoose";
import { GoalRepository } from "../repositories/GoalRepository.js";
import { MissionRepository } from "../repositories/MissionRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { cleanText } from "./careerProfile.js";

export const GOAL_LIMITS = Object.freeze({ perUser: 50, milestones: 20, skills: 10 });
export const GOAL_CATEGORIES = Object.freeze(["career", "academic", "project", "personal"]);
const statuses = ["active", "paused", "completed", "abandoned"];

const assertObjectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `${label} is invalid.`);
};

const parseOptionalDate = (value, field) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${field} is not a valid date.`);
  return date;
};

const normalizeSkills = (skills) => {
  if (skills === undefined) return undefined;
  if (!Array.isArray(skills)) throw new ApiError(400, "Skills must be a list.");
  const names = skills.map((skill) => cleanText(String(skill ?? ""), { field: "Skill", max: 60 })).filter(Boolean);
  return [...new Map(names.map((name) => [name.toLowerCase(), name])).values()].slice(0, GOAL_LIMITS.skills);
};

const normalizeMilestones = (milestones, existing = []) => {
  if (milestones === undefined) return undefined;
  if (!Array.isArray(milestones)) throw new ApiError(400, "Milestones must be a list.");
  if (milestones.length > GOAL_LIMITS.milestones) throw new ApiError(400, `A goal can have up to ${GOAL_LIMITS.milestones} milestones.`);
  const previous = new Map(existing.map((milestone) => [String(milestone._id), milestone]));
  return milestones.map((milestone) => {
    const title = cleanText(milestone?.title, { field: "Milestone title", max: 140, min: 1, required: true });
    const done = milestone?.done === true;
    const prior = milestone?.id ? previous.get(String(milestone.id)) : null;
    return {
      ...(prior ? { _id: prior._id } : {}),
      title,
      done,
      doneAt: done ? prior?.doneAt || new Date() : null,
      dueDate: parseOptionalDate(milestone?.dueDate, "Milestone due date") ?? null
    };
  });
};

/** Progress comes from milestones the user actually ticked off, not from time elapsed. */
export function goalProgress(goal) {
  if (goal.status === "completed") return 100;
  const milestones = goal.milestones || [];
  if (!milestones.length) return 0;
  return Math.round((milestones.filter((milestone) => milestone.done).length / milestones.length) * 100);
}

export function serializeGoal(goal, now = new Date()) {
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000) : null;
  return {
    id: String(goal._id || goal.id),
    title: goal.title,
    category: goal.category,
    description: goal.description || "",
    deadline: goal.deadline || null,
    daysLeft,
    overdue: daysLeft !== null && daysLeft < 0 && !["completed", "abandoned"].includes(goal.status),
    status: goal.status,
    milestones: (goal.milestones || []).map((milestone) => ({
      id: String(milestone._id),
      title: milestone.title,
      done: Boolean(milestone.done),
      doneAt: milestone.doneAt || null,
      dueDate: milestone.dueDate || null
    })),
    skills: goal.skills || [],
    sharedWithTeam: Boolean(goal.sharedWithTeam),
    progress: goalProgress(goal),
    completedAt: goal.completedAt || null
  };
}

export class GoalService {
  constructor({ goalRepository = new GoalRepository(), missionRepository = new MissionRepository(), clock = () => new Date() } = {}) {
    Object.assign(this, { goalRepository, missionRepository, clock });
  }

  async list(user) {
    const goals = await this.goalRepository.listByUser(user.id);
    const now = this.clock();
    const serialized = goals.map((goal) => serializeGoal(goal, now));
    return {
      goals: serialized,
      summary: {
        active: serialized.filter((goal) => goal.status === "active").length,
        completed: serialized.filter((goal) => goal.status === "completed").length,
        overdue: serialized.filter((goal) => goal.overdue).length
      },
      categories: GOAL_CATEGORIES,
      limits: GOAL_LIMITS
    };
  }

  parseFields(payload, existing = null) {
    const fields = {};
    if (payload.title !== undefined || !existing) fields.title = cleanText(payload.title, { field: "Goal title", max: 120, min: 2, required: true });
    if (payload.description !== undefined) fields.description = cleanText(payload.description, { field: "Description", max: 600 });
    if (payload.category !== undefined) {
      if (!GOAL_CATEGORIES.includes(payload.category)) throw new ApiError(400, "Choose a valid goal category.");
      fields.category = payload.category;
    }
    if (payload.status !== undefined) {
      if (!statuses.includes(payload.status)) throw new ApiError(400, "Choose a valid goal status.");
      fields.status = payload.status;
      fields.completedAt = payload.status === "completed" ? existing?.completedAt || this.clock() : null;
    }
    const deadline = parseOptionalDate(payload.deadline, "Deadline");
    if (deadline !== undefined) fields.deadline = deadline;
    const skills = normalizeSkills(payload.skills);
    if (skills !== undefined) fields.skills = skills;
    const milestones = normalizeMilestones(payload.milestones, existing?.milestones || []);
    if (milestones !== undefined) fields.milestones = milestones;
    if (typeof payload.sharedWithTeam === "boolean") fields.sharedWithTeam = payload.sharedWithTeam;
    return fields;
  }

  async create(user, payload = {}) {
    const count = await this.goalRepository.countByUser(user.id);
    if (count >= GOAL_LIMITS.perUser) throw new ApiError(409, `You can keep up to ${GOAL_LIMITS.perUser} goals. Archive or delete one first.`);
    const goal = await this.goalRepository.create({ user: user.id, ...this.parseFields(payload) });
    return serializeGoal(goal, this.clock());
  }

  async update(user, goalId, payload = {}) {
    assertObjectId(goalId, "Goal ID");
    const goal = await this.goalRepository.findOwned(user.id, goalId);
    if (!goal) throw new ApiError(404, "Goal not found");
    Object.assign(goal, this.parseFields(payload, goal));
    return serializeGoal(await this.goalRepository.save(goal), this.clock());
  }

  async toggleMilestone(user, goalId, milestoneId, done) {
    assertObjectId(goalId, "Goal ID");
    assertObjectId(milestoneId, "Milestone ID");
    const goal = await this.goalRepository.findOwned(user.id, goalId);
    if (!goal) throw new ApiError(404, "Goal not found");
    const milestone = (goal.milestones || []).find((entry) => String(entry._id) === String(milestoneId));
    if (!milestone) throw new ApiError(404, "Milestone not found");
    milestone.done = done === true;
    milestone.doneAt = milestone.done ? milestone.doneAt || this.clock() : null;
    return serializeGoal(await this.goalRepository.save(goal), this.clock());
  }

  async remove(user, goalId) {
    assertObjectId(goalId, "Goal ID");
    const result = await this.goalRepository.deleteOwned(user.id, goalId);
    if (!result?.deletedCount) throw new ApiError(404, "Goal not found");
    await this.missionRepository.unlinkGoal(user.id, goalId);
    return { deleted: true };
  }
}
