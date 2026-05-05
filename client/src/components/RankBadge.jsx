export default function RankBadge({ rank }) {
  return (
    <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-200/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-amber-200">
      {rank}
    </div>
  );
}
