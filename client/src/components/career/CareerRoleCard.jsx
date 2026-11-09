import { getCategoryName } from "../../data/careerRoles.js";
import { cx } from "../../utils/cx";

/** One option in the career listbox. Mouse users click; keyboard users move aria-activedescendant. */
export default function CareerRoleCard({ id, option, active, selected, onSelect, onHover }) {
  const isCustom = option.type === "custom";
  return (
    <li
      aria-selected={selected}
      className={cx(
        "cursor-pointer rounded-xl border px-3 py-2.5 transition",
        active ? "border-[#F59E0B]/50 bg-[#F59E0B]/10" : "border-transparent hover:bg-white/[0.04]",
        selected && !active ? "border-white/15" : null
      )}
      id={id}
      role="option"
      onClick={onSelect}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
    >
      {isCustom ? (
        <div>
          <div className="text-sm font-semibold text-[#F97316]">
            {option.title ? `Use “${option.title}” as a custom role` : "Enter a custom role"}
          </div>
          <div className="mt-0.5 text-xs text-[#A1A1AA]">Not listed? Describe your own goal and choose its skills.</div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{option.role.name}</div>
            <div className="mt-0.5 line-clamp-1 text-xs text-[#A1A1AA]">{option.role.description}</div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1AA]">
            {getCategoryName(option.role.category)}
          </span>
        </div>
      )}
    </li>
  );
}
