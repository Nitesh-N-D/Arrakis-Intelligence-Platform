import { useState } from "react";
import { CAREER_CATEGORIES, suggestSkillsForTitle } from "../../data/careerRoles.js";
import { cx } from "../../utils/cx";
import { addCustomSkill, CUSTOM_LIMITS } from "./careerSelectorModel";

const fieldClass = "focus-ring w-full rounded-button border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white placeholder:text-[#A1A1AA]";

/**
 * Custom career entry. Skill suggestions come from the local catalogue (deterministic, nothing
 * is sent anywhere) and are only added when the user chooses them.
 */
export default function CustomCareerForm({ selection, errors = {}, onChange, idPrefix = "custom-career" }) {
  const [skillDraft, setSkillDraft] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const skills = selection.customSkills || [];
  const update = (patch) => onChange({ ...selection, ...patch });

  const addSkill = (name, priority = "important") => update({ customSkills: addCustomSkill(skills, name, priority) });

  return (
    <div className="grid gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]" htmlFor={`${idPrefix}-title`}>
          Role title
        </label>
        <input
          aria-describedby={errors.customTitle ? `${idPrefix}-title-error` : undefined}
          aria-invalid={Boolean(errors.customTitle)}
          className={fieldClass}
          id={`${idPrefix}-title`}
          maxLength={CUSTOM_LIMITS.titleMax}
          placeholder="e.g. Robotics Software Engineer"
          value={selection.customTitle}
          onChange={(event) => update({ customTitle: event.target.value })}
        />
        {errors.customTitle ? <p className="mt-1 text-xs text-red-200" id={`${idPrefix}-title-error`}>{errors.customTitle}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]" htmlFor={`${idPrefix}-category`}>
            Closest category
          </label>
          <select
            className={fieldClass}
            id={`${idPrefix}-category`}
            value={selection.customCategory || "other"}
            onChange={(event) => update({ customCategory: event.target.value })}
          >
            {CAREER_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]" htmlFor={`${idPrefix}-description`}>
            Short description <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            className={fieldClass}
            id={`${idPrefix}-description`}
            maxLength={CUSTOM_LIMITS.descriptionMax}
            placeholder="What does this role do?"
            value={selection.customDescription}
            onChange={(event) => update({ customDescription: event.target.value })}
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Skills this role needs</legend>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-skill`}>Add a skill</label>
          <input
            className={fieldClass}
            id={`${idPrefix}-skill`}
            maxLength={CUSTOM_LIMITS.skillNameMax}
            placeholder="Type a skill and press Enter"
            value={skillDraft}
            onChange={(event) => setSkillDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkill(skillDraft);
                setSkillDraft("");
              }
            }}
          />
          <button
            className="focus-ring shrink-0 rounded-button border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white hover:border-white/20"
            disabled={!skillDraft.trim() || skills.length >= CUSTOM_LIMITS.skillsMax}
            type="button"
            onClick={() => { addSkill(skillDraft); setSkillDraft(""); }}
          >
            Add
          </button>
        </div>
        {errors.customSkills ? <p className="mt-1 text-xs text-red-200">{errors.customSkills}</p> : null}

        {skills.length ? (
          <ul aria-label="Chosen skills" className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <li key={skill.name} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1 text-xs text-white">
                {skill.name}
                <label className="sr-only" htmlFor={`${idPrefix}-priority-${index}`}>Priority for {skill.name}</label>
                <select
                  className="rounded-full bg-transparent px-1 text-[11px] text-[#A1A1AA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                  id={`${idPrefix}-priority-${index}`}
                  value={skill.priority}
                  onChange={(event) => update({
                    customSkills: skills.map((entry, i) => (i === index ? { ...entry, priority: event.target.value } : entry))
                  })}
                >
                  <option value="core">core</option>
                  <option value="important">important</option>
                  <option value="supporting">supporting</option>
                </select>
                <button
                  aria-label={`Remove ${skill.name}`}
                  className="focus-ring rounded-full px-1.5 text-[#A1A1AA] hover:text-white"
                  type="button"
                  onClick={() => update({ customSkills: skills.filter((_, i) => i !== index) })}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-[#A1A1AA]">Add a few skills so the roadmap knows what to plan. You can change them later.</p>
        )}

        <div className="mt-3">
          <button
            className="focus-ring text-xs font-semibold text-[#F59E0B] underline-offset-4 hover:underline disabled:opacity-50"
            disabled={String(selection.customTitle || "").trim().length < CUSTOM_LIMITS.titleMin}
            type="button"
            onClick={() => setSuggestions(suggestSkillsForTitle(selection.customTitle))}
          >
            Suggest skills from similar careers
          </button>
          {suggestions ? (
            suggestions.skills.length ? (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-[#A1A1AA]">Based on {suggestions.basedOn.join(" and ")}. Choose the ones that apply:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.skills.map((skill) => {
                    const added = skills.some((entry) => entry.name.toLowerCase() === skill.name.toLowerCase());
                    return (
                      <button
                        key={skill.name}
                        aria-pressed={added}
                        className={cx(
                          "focus-ring rounded-full border px-2.5 py-1 text-xs",
                          added ? "border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B]" : "border-white/10 text-white hover:border-white/25"
                        )}
                        disabled={added}
                        type="button"
                        onClick={() => addSkill(skill.name, skill.priority)}
                      >
                        {added ? "✓ " : "+ "}{skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#A1A1AA]">No similar careers found. Add skills manually.</p>
            )
          ) : null}
        </div>
      </fieldset>
    </div>
  );
}
