import { CUSTOM_ROLE_ID, getCategoryName, getRoleById } from "../../data/careerRoles.js";
import CareerSkillPreview from "./CareerSkillPreview";

/** Summary of the chosen career with its skill preview. */
export default function CareerSummaryCard({ selection, showSkills = true }) {
  if (!selection?.roleId) return null;
  const isCustom = selection.roleId === CUSTOM_ROLE_ID;
  const role = isCustom ? null : getRoleById(selection.roleId);
  const title = isCustom ? selection.customTitle : role?.name;
  const category = isCustom ? selection.customCategory : role?.category;
  const description = isCustom ? selection.customDescription : role?.description;
  const skills = isCustom ? selection.customSkills : role?.skills || [];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414]/80 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-white">{title || "Custom role"}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A1A1AA]">
          {getCategoryName(category || "other")}
        </span>
        {isCustom ? (
          <span className="rounded-full border border-[#F97316]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#F97316]">Custom</span>
        ) : null}
      </div>
      {description ? <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{description}</p> : null}
      {role?.prerequisites?.length ? (
        <p className="mt-2 text-xs text-[#A1A1AA]">
          <span className="font-semibold text-white/80">Helpful background:</span> {role.prerequisites.join(", ")}
        </p>
      ) : null}
      {showSkills ? (
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Skills you will build</div>
          <CareerSkillPreview compact emptyText="Add skills below so your roadmap has something to plan." skills={skills} />
        </div>
      ) : null}
    </div>
  );
}
