export default function SpiceMeter({ totalSpice }) {
  const progress = Math.min((totalSpice % 500) / 5, 100);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-white/70">
        <span>Spice Reservoir</span>
        <span>{totalSpice} spice</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-orange-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
