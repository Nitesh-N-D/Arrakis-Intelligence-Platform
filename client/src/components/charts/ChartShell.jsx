import Card from "../ui/Card";

export default function ChartShell({ eyebrow, title, description, children }) {
  return (
    <Card className="h-full">
      <div className="text-xs uppercase tracking-[0.34em] text-white/45">{eyebrow}</div>
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-display text-2xl text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>
      </div>
      <div className="mt-6 h-[18rem] sm:h-80">{children}</div>
    </Card>
  );
}
