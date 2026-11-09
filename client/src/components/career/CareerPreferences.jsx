import { EXPERIENCE_LEVELS, TIMELINE_OPTIONS } from "../../data/careerRoles.js";
import { cx } from "../../utils/cx";

function ChoiceGroup({ legend, name, options, value, onChange, hint }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">{legend}</legend>
      {hint ? <p className="mt-1 text-xs text-[#A1A1AA]/80">{hint}</p> : null}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cx(
                "flex cursor-pointer flex-col rounded-xl border px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-[#F59E0B]/60",
                checked ? "border-[#F59E0B]/50 bg-[#F59E0B]/10 text-white" : "border-white/10 bg-white/[0.02] text-[#A1A1AA] hover:border-white/20"
              )}
              title={option.description}
            >
              <input
                checked={checked}
                className="sr-only"
                name={name}
                type="radio"
                value={option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="font-semibold">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Experience, target proficiency and timeline. All optional; they tune expectations and plan length. */
export default function CareerPreferences({ selection, onChange, idPrefix = "career-pref" }) {
  const levels = EXPERIENCE_LEVELS.map((level) => ({ value: level.id, label: level.label, description: level.description }));
  return (
    <div className="grid gap-4">
      <ChoiceGroup
        hint="Where you are today in this field."
        legend="Current experience"
        name={`${idPrefix}-experience`}
        options={levels}
        value={selection.experienceLevel}
        onChange={(experienceLevel) => onChange({ ...selection, experienceLevel })}
      />
      <ChoiceGroup
        hint="The level you want to reach. This adjusts how high each skill's target is set."
        legend="Target level"
        name={`${idPrefix}-target`}
        options={levels}
        value={selection.targetLevel}
        onChange={(targetLevel) => onChange({ ...selection, targetLevel })}
      />
      <ChoiceGroup
        legend="Timeline"
        name={`${idPrefix}-timeline`}
        options={TIMELINE_OPTIONS.map((option) => ({ value: option.months, label: option.label }))}
        value={selection.timelineMonths}
        onChange={(timelineMonths) => onChange({ ...selection, timelineMonths })}
      />
    </div>
  );
}
