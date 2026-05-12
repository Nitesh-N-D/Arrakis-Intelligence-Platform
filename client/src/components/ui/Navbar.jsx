import Button from "./Button";
import RankBadge from "./RankBadge";

export default function Navbar({
  operative,
  billingPlan = "free",
  onMenu,
  onUpgrade,
  onLogout
}) {
  return (
    <header className="glass-panel sticky top-4 z-30 mb-6 px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button className="xl:hidden" onClick={onMenu} variant="secondary">
            Menu
          </Button>
          <div>
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">Arrakis Intelligence Platform</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {operative?.name || "Operative"} | {operative?.targetRole || "Discipline track"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RankBadge rank={operative?.rank || operative?.currentRank || "Outworlder"} />
          <div className="rounded-full border border-border-subtle bg-white/5 px-4 py-2 text-sm text-white/70">
            Plan <span className="font-semibold uppercase text-amber-100">{billingPlan}</span>
          </div>
          {billingPlan !== "pro" ? (
            <Button onClick={onUpgrade}>Upgrade</Button>
          ) : null}
          <Button onClick={onLogout} variant="ghost">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
