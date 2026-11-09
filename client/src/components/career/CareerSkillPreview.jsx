import { cx } from "../../utils/cx";

const priorityStyles = {
  core: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]",
  important: "border-[#F97316]/30 bg-[#F97316]/10 text-[#F97316]",
  supporting: "border-white/10 bg-white/[0.04] text-[#A1A1AA]"
};

/** Skills a role needs, with the documented reason each one matters. */
export default function CareerSkillPreview({ skills = [], compact = false, emptyText = "No skills yet." }) {
  if (!skills.length) return <p className="text-sm text-[#A1A1AA]">{emptyText}</p>;
  const visible = compact ? skills.slice(0, 6) : skills;
  return (
    <ul className="grid gap-2">
      {visible.map((skill) => (
        <li key={skill.name} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white">{skill.name}</span>
            <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", priorityStyles[skill.priority] || priorityStyles.important)}>
              {skill.priority || "important"}
            </span>
          </div>
          {!compact && skill.why ? <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{skill.why}</p> : null}
        </li>
      ))}
      {compact && skills.length > visible.length ? (
        <li className="text-xs text-[#A1A1AA]">+{skills.length - visible.length} more skills</li>
      ) : null}
    </ul>
  );
}
