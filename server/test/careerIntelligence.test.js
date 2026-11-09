import test from "node:test";
import assert from "node:assert/strict";
import {
  CAREER_CATEGORIES,
  CAREER_ROLES,
  SKILL_LIBRARY,
  findRoleByName,
  getRoleById,
  searchCareerRoles,
  suggestSkillsForTitle
} from "../src/data/careerRoles.js";
import { roleSkillMatrix } from "../src/dune/skillMatrix.js";
import {
  careerFromTargetRole,
  normalizeCareerInput,
  resolveCareerProfile,
  serializeCareer
} from "../src/services/careerProfile.js";
import { CareerService } from "../src/services/careerService.js";
import { RoadmapService } from "../src/services/roadmapService.js";
import { SkillAnalyzerService } from "../src/services/skillAnalyzerService.js";

const categoryIds = new Set(CAREER_CATEGORIES.map((category) => category.id));

test("catalogue: unique ids, known categories, documented skills and normalised weights", () => {
  assert.ok(CAREER_ROLES.length >= 60, "catalogue should cover a broad set of careers");
  const ids = new Set();
  const names = new Set();
  for (const role of CAREER_ROLES) {
    assert.ok(!ids.has(role.id), `duplicate role id ${role.id}`);
    assert.ok(!names.has(role.name.toLowerCase()), `duplicate role name ${role.name}`);
    ids.add(role.id);
    names.add(role.name.toLowerCase());
    assert.ok(categoryIds.has(role.category), `${role.id} has unknown category`);
    role.categories.forEach((category) => assert.ok(categoryIds.has(category), `${role.id} alsoIn ${category}`));
    assert.ok(role.description.length > 10, `${role.id} needs a description`);
    assert.ok(role.skills.length >= 3, `${role.id} needs at least three skills`);
    const total = role.skills.reduce((sum, skill) => sum + skill.weight, 0);
    assert.ok(Math.abs(total - 1) < 0.011, `${role.id} weights sum to ${total}`);
    const skillIds = new Set();
    for (const skill of role.skills) {
      assert.ok(SKILL_LIBRARY[skill.id], `${role.id} references unknown skill ${skill.id}`);
      assert.ok(!skillIds.has(skill.id), `${role.id} lists ${skill.id} twice`);
      skillIds.add(skill.id);
      assert.ok(["core", "important", "supporting"].includes(skill.priority));
      assert.ok(skill.minLevel >= 1 && skill.minLevel <= 5);
      assert.ok(skill.why && skill.why.length > 10, `${role.id}/${skill.id} must document why it matters`);
    }
  }
  for (const [id, skill] of Object.entries(SKILL_LIBRARY)) {
    assert.ok(skill.name && skill.why, `skill ${id} needs name and why`);
    for (const resource of skill.resources || []) assert.match(resource.url, /^https:\/\//, `${id} resource must be https`);
  }
});

test("catalogue keeps the two legacy roles and maps aliases", () => {
  assert.ok(roleSkillMatrix["AI Systems Engineer"]);
  assert.ok(roleSkillMatrix["Product Engineering Lead"]);
  assert.equal(getRoleById("ai-systems-engineer").name, "AI Systems Engineer");
  assert.equal(findRoleByName("systems reliability engineer").id, findRoleByName("SRE").id);
});

test("search matches names, aliases, keywords and categories", () => {
  assert.equal(searchCareerRoles("sre")[0].id, findRoleByName("SRE").id);
  assert.ok(searchCareerRoles("ml").some((role) => role.category === "ai-ml"));
  const security = searchCareerRoles("", { categoryId: "cybersecurity" });
  assert.ok(security.length > 0);
  assert.ok(security.every((role) => role.categories.includes("cybersecurity")));
  assert.deepEqual(searchCareerRoles("zzzzqqq"), []);
  const suggestion = suggestSkillsForTitle("Python data platform engineer");
  assert.ok(suggestion.skills.length > 0);
});

test("career input: catalogue IDs are re-resolved on the server; client titles are ignored", () => {
  const career = normalizeCareerInput({ roleId: "ai-systems-engineer", title: "Hacked", isCustom: true, category: "evil" });
  assert.equal(career.title, "AI Systems Engineer");
  assert.equal(career.isCustom, false);
  assert.equal(career.category, getRoleById("ai-systems-engineer").category);
  assert.throws(() => normalizeCareerInput({ roleId: "__proto__" }), { statusCode: 400 });
  assert.throws(() => normalizeCareerInput({ roleId: "toString" }), { statusCode: 400 });
  assert.throws(() => normalizeCareerInput({ roleId: "ai-systems-engineer", experienceLevel: "god" }), { statusCode: 400 });
  assert.throws(() => normalizeCareerInput({ roleId: "ai-systems-engineer", timelineMonths: 7 }), { statusCode: 400 });
  assert.throws(() => normalizeCareerInput(null), { statusCode: 400 });
  assert.throws(() => normalizeCareerInput([]), { statusCode: 400 });
});

test("career input: custom roles are cleaned, bounded and de-duplicated", () => {
  const career = normalizeCareerInput({
    roleId: "custom",
    customTitle: "  Quantum   Software Engineer ",
    customCategory: "research",
    customDescription: "Building compilers for quantum hardware",
    customSkills: ["python", { name: "Python" }, { name: "Linear Algebra", priority: "core" }]
  });
  assert.equal(career.title, "Quantum Software Engineer");
  assert.equal(career.category, "research");
  assert.equal(career.customSkills.length, 2);
  assert.equal(career.customSkills[0].name, "Python");
  assert.equal(career.customSkills[1].priority, "core");
  for (const bad of ["", " ", "x", "<b>role</b>", "R".repeat(81), "12345", "zero​width role", "line\u0007bell role"]) {
    assert.throws(() => normalizeCareerInput({ roleId: "custom", customTitle: bad }), { statusCode: 400 }, JSON.stringify(bad));
  }
  assert.throws(
    () => normalizeCareerInput({ roleId: "custom", customTitle: "Valid Role", customSkills: Array.from({ length: 21 }, (_, i) => `S${i}`) }),
    { statusCode: 400 }
  );
  assert.throws(() => normalizeCareerInput({ roleId: "custom", customTitle: "Valid Role", customCategory: "nope" }), { statusCode: 400 });
  assert.throws(
    () => normalizeCareerInput({ roleId: "custom", customTitle: "Valid Role", customSkills: [{ name: "Go", priority: "max" }] }),
    { statusCode: 400 }
  );
});

test("legacy targetRole strings resolve to catalogue roles, otherwise to custom", () => {
  assert.equal(careerFromTargetRole("AI Systems Engineer").roleId, "ai-systems-engineer");
  const custom = careerFromTargetRole("Frontend Intelligence Engineer");
  assert.equal(custom.isCustom, true);
  assert.equal(custom.title, "Frontend Intelligence Engineer");
});

test("analysis: legacy users without a career still get the catalogue requirements", () => {
  const profile = resolveCareerProfile({ targetRole: "AI Systems Engineer", career: null });
  assert.equal(profile.roleId, "ai-systems-engineer");
  assert.ok(profile.requirements.length > 0);
  assert.throws(() => resolveCareerProfile({ targetRole: "Unknown", career: null }), { statusCode: 400 });
  const custom = resolveCareerProfile({ targetRole: "Unknown", career: null, allowCustom: true });
  assert.equal(custom.isCustom, true);
  assert.equal(custom.requirements.length, 0);
});

test("analysis: unknown roles for dashboards return guidance instead of failing", () => {
  const analyzer = new SkillAnalyzerService();
  const result = analyzer.analyze({ userSkills: [], targetRole: "Frontend Intelligence Engineer", allowCustom: true });
  assert.equal(result.needsSkills, true);
  assert.equal(result.completion, 0);
  assert.deepEqual(result.disciplineMap, []);
});

test("analysis: target level shifts expectations and completion avoids false precision", () => {
  const analyzer = new SkillAnalyzerService();
  const base = { userSkills: [{ name: "Python", level: 3 }], targetRole: "AI Systems Engineer" };
  const role = { roleId: "ai-systems-engineer", title: "AI Systems Engineer" };
  const intermediate = analyzer.analyze({ ...base, career: { ...role, targetLevel: "intermediate" } });
  const expert = analyzer.analyze({ ...base, career: { ...role, targetLevel: "expert" } });
  assert.ok(intermediate.completion >= expert.completion);
  assert.equal(intermediate.completion % 5, 0);
  assert.ok(["Getting started", "Building", "Solid foundation", "Role-ready"].includes(intermediate.readiness));
  expert.disciplineMap.forEach((item) => {
    assert.ok(item.why);
    assert.ok(item.project);
    assert.ok(["high", "medium", "low"].includes(item.priorityBand));
  });
  const custom = analyzer.analyze({
    userSkills: [],
    targetRole: "Robotics Engineer",
    career: {
      roleId: "custom",
      title: "Robotics Engineer",
      isCustom: true,
      customSkills: [{ name: "Python", priority: "core" }, { name: "ROS", priority: "important" }]
    },
    allowCustom: true
  });
  assert.equal(custom.disciplineMap.length, 2);
  assert.equal(custom.disciplineMap[0].skill, "Python");
});

test("serializeCareer exposes onboarding state and resolves legacy users", () => {
  const pending = serializeCareer({ targetRole: "AI Systems Engineer", career: { selectionPending: true } });
  assert.equal(pending.selectionPending, true);
  assert.equal(pending.roleId, "ai-systems-engineer");
  const legacy = serializeCareer({ targetRole: "Product Engineering Lead" });
  assert.equal(legacy.isCustom, false);
  assert.equal(legacy.selectionPending, false);
});

// ---------- Roadmap migration and mastery ----------

const roadmapUser = (overrides = {}) => ({
  id: "user-r",
  targetRole: "AI Systems Engineer",
  skills: [],
  career: null,
  careerHistory: [],
  ...overrides
});

function memoryRoadmapRepository(initial = null) {
  const store = { roadmap: initial, saves: 0, created: 0 };
  return {
    store,
    async findByUser() { return store.roadmap; },
    async create(value) { store.created += 1; store.roadmap = { ...value, history: [] }; return store.roadmap; },
    async save(value) { store.saves += 1; store.roadmap = value; return value; }
  };
}

test("roadmap: role change preserves completed phases and keeps work in progress", async () => {
  const repo = memoryRoadmapRepository();
  const service = new RoadmapService({ roadmapRepository: repo, userRepository: {} });
  const user = roadmapUser();
  const initial = await service.ensureRoadmap(user);
  assert.ok(initial.phases.length > 1);
  initial.phases.forEach((phase, index) => { phase.id = `p${index}`; });
  initial.phases[0].status = "done";
  initial.phases[0].completedAt = new Date();
  initial.phases[1].status = "active";
  initial.phases[1].notes = "Halfway through the course";
  const doneSkill = initial.phases[0].skill;
  const notedSkill = initial.phases[1].skill;

  const next = normalizeCareerInput({ roleId: "frontend-developer" });
  const preview = await service.previewCareerChange(user, next);
  assert.equal(preview.requiresConfirmation, true);
  assert.deepEqual(preview.preserved, [doneSkill]);

  const migrated = await service.applyCareer({ ...user, targetRole: next.title, career: next }, next, "role-change");
  assert.equal(migrated.targetRole, "Frontend Developer");
  assert.equal(migrated.phases[0].skill, doneSkill);
  assert.equal(migrated.phases[0].status, "done");
  assert.equal(migrated.phases[0].fromRole, "AI Systems Engineer");
  assert.equal(migrated.phases.filter((phase) => phase.status === "active").length, 1);
  const carried = migrated.phases.find((phase) => phase.skill === notedSkill);
  if (carried) {
    assert.equal(carried.notes, "Halfway through the course");
  } else {
    assert.equal(migrated.history.length, 1);
    assert.equal(migrated.history[0].phases[0].notes, "Halfway through the course");
  }
});

test("roadmap: legacy plans are back-filled without changing status", async () => {
  const legacy = {
    targetRole: "AI Systems Engineer",
    currentPhaseIndex: 0,
    phases: [{ id: "a", skill: "Python", difficulty: "medium", status: "active", tasks: ["x"] }]
  };
  const repo = memoryRoadmapRepository(legacy);
  const service = new RoadmapService({ roadmapRepository: repo, userRepository: {} });
  const roadmap = await service.ensureRoadmap(roadmapUser());
  assert.equal(roadmap.phases[0].status, "active");
  assert.equal(roadmap.phases[0].assessmentCriteria.length, 3);
  assert.equal(repo.store.saves, 1);
  await service.ensureRoadmap(roadmapUser());
  assert.equal(repo.store.saves, 1, "back-fill is idempotent");
});

test("roadmap: mastery requires tasks, evidence and assessment; phase updates are scoped", async () => {
  const phase = (id, status) => ({
    id,
    skill: id.toUpperCase(),
    difficulty: "easy",
    status,
    tasks: ["one", "two"],
    completedTasks: [],
    assessmentCriteria: ["a", "b", "c"],
    assessmentConfirmed: [],
    evidence: [],
    notes: "",
    bookmarkedResources: [],
    resources: [{ title: "Docs", url: "https://example.com/docs" }],
    expectedLevel: 3
  });
  const roadmap = { targetRole: "AI Systems Engineer", currentPhaseIndex: 0, phases: [phase("a", "active"), phase("b", "locked")] };
  const repo = memoryRoadmapRepository(roadmap);
  const replaced = [];
  const service = new RoadmapService({
    roadmapRepository: repo,
    userRepository: { async replaceSkillLevel(...args) { replaced.push(args); } }
  });
  const user = roadmapUser();

  await assert.rejects(service.completePhase(user, "a"), { statusCode: 409 });
  await assert.rejects(service.updatePhase(user, "b", { task: { index: 0, done: true } }), { statusCode: 409 });
  await assert.rejects(service.updatePhase(user, "a", { task: { index: 9, done: true } }), { statusCode: 400 });
  await assert.rejects(service.updatePhase(user, "a", { bookmark: { url: "https://evil.example" } }), { statusCode: 400 });
  await assert.rejects(service.updatePhase(user, "a", { notes: "x".repeat(4001) }), { statusCode: 400 });
  await assert.rejects(service.updatePhase(user, "missing", { notes: "x" }), { statusCode: 404 });
  await assert.rejects(service.addEvidence(user, "a", { summary: "too short" }), { statusCode: 400 });
  await assert.rejects(service.addEvidence(user, "a", { summary: "x".repeat(50), url: "javascript:alert(1)" }), { statusCode: 400 });
  await assert.rejects(service.addEvidence(user, "b", { summary: "x".repeat(50) }), { statusCode: 409 });

  await service.updatePhase(user, "b", { notes: "Planning ahead", bookmark: { url: "https://example.com/docs" } });
  assert.equal(roadmap.phases[1].notes, "Planning ahead");
  assert.deepEqual(roadmap.phases[1].bookmarkedResources, ["https://example.com/docs"]);

  await service.updatePhase(user, "a", { task: { index: 0, done: true } });
  await service.updatePhase(user, "a", { task: { index: 1, done: true } });
  await assert.rejects(service.completePhase(user, "a"), /evidence/);
  await service.addEvidence(user, "a", {
    summary: "Shipped a small CLI and wrote up the trade-offs I made.",
    url: "https://github.com/example/repo"
  });
  for (const index of [0, 1, 2]) await service.updatePhase(user, "a", { assessment: { index, confirmed: true } });

  const done = await service.completePhase(user, "a");
  assert.equal(done.phases[0].status, "done");
  assert.equal(done.phases[1].status, "active");
  assert.equal(done.phases[1].notes, "Planning ahead");
  assert.deepEqual(replaced, [["user-r", "A", 3]]);
  // Completing again is a no-op, and evidence on completed phases is kept.
  await service.completePhase(user, "a");
  assert.equal(replaced.length, 1);
  await assert.rejects(service.removeEvidence(user, "a", "anything"), { statusCode: 409 });
});

test("career service: progress requires confirmation; skills and history are kept", async () => {
  const updates = [];
  let progress = true;
  const roadmapService = {
    async previewCareerChange(_user, next) { return { to: next.title, requiresConfirmation: progress, hasProgress: progress }; },
    async applyCareer(_user, next, reason) { return { targetRole: next.title, reason }; }
  };
  const user = roadmapUser({ skills: [{ name: "Python", level: 3 }] });
  const userRepository = {
    async updateById(id, update) { updates.push({ id, update }); return { ...user, ...update }; }
  };
  const service = new CareerService({ userRepository, roadmapService, skillAnalyzerService: new SkillAnalyzerService() });

  await assert.rejects(service.update(user, { career: { roleId: "frontend-developer" } }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.equal(error.details.to, "Frontend Developer");
    return true;
  });
  assert.equal(updates.length, 0);

  const result = await service.update(user, { career: { roleId: "frontend-developer" }, confirmRoadmapChange: true });
  assert.equal(updates[0].id, "user-r");
  assert.equal(updates[0].update.targetRole, "Frontend Developer");
  assert.equal(updates[0].update.skills, undefined, "skills are never overwritten by a career change");
  assert.equal(updates[0].update.careerHistory.at(-1).title, "AI Systems Engineer");
  assert.equal(result.roadmap.reason, "role-change");

  progress = false;
  const preview = await service.preview(user, { roleId: "frontend-developer" });
  assert.ok(preview.analysis.disciplineMap.length > 0);
  assert.equal(preview.impact.requiresConfirmation, false);
});
