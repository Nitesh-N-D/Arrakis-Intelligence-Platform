import Button from "../ui/Button";
import Modal from "../ui/Modal";

function SkillList({ label, skills, tone = "text-white" }) {
  if (!skills?.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</div>
      <p className={`mt-1 text-sm ${tone}`}>{skills.join(", ")}</p>
    </div>
  );
}

/** Shows what a career change does to the roadmap before the user confirms it. */
export default function CareerChangeDialog({ open, impact, busy, onCancel, onConfirm }) {
  return (
    <Modal
      description={impact ? `You are switching from ${impact.from} to ${impact.to}. Nothing is deleted: here is what happens to your roadmap.` : ""}
      open={open}
      title="Review roadmap change"
      onClose={busy ? undefined : onCancel}
    >
      {impact ? (
        <div className="grid gap-4">
          <SkillList label="Completed phases kept" skills={impact.preserved} tone="text-emerald-200" />
          <SkillList label="In-progress work carried over" skills={impact.carriedOver} />
          <SkillList label="New phases added" skills={impact.added} tone="text-[#F59E0B]" />
          <SkillList label="Moved to roadmap history (notes and evidence kept)" skills={impact.archived} tone="text-[#A1A1AA]" />
          <p className="text-xs leading-5 text-[#A1A1AA]">
            Your {impact.skillsKept} recorded skill{impact.skillsKept === 1 ? "" : "s"} and learning history stay on your profile.
            The new roadmap will have {impact.totalPhases} phase{impact.totalPhases === 1 ? "" : "s"}.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={busy} variant="secondary" onClick={onCancel}>Keep current career</Button>
            <Button data-dialog-initial-focus disabled={busy} onClick={onConfirm}>{busy ? "Switching..." : "Confirm change"}</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
