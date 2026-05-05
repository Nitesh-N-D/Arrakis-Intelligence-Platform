export default function RankBadge({ rank = "Outworlder" }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 shadow-glow">
      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400" />
      <div>
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">Current Rank</div>
        <div className="text-sm font-semibold text-amber-100">{rank}</div>
      </div>
    </div>
  );
}
