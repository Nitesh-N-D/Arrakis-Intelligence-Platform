import { cx } from "../../utils/cx";
import { categoryTabs } from "./careerSelectorModel";

/** Category filter. Toggle buttons (aria-pressed) rather than tabs: they filter one shared list. */
export default function CareerCategoryTabs({ value, onChange }) {
  return (
    <div aria-label="Filter careers by category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group">
      {categoryTabs().map((category) => {
        const active = value === category.id;
        return (
          <button
            key={category.id}
            aria-pressed={active}
            className={cx(
              "focus-ring shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#F59E0B]"
                : "border-white/10 bg-white/[0.03] text-[#A1A1AA] hover:border-white/20 hover:text-white"
            )}
            type="button"
            onClick={() => onChange(category.id)}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
