import Card from "./Card";

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/55">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400" />
            {eyebrow}
          </div>
          <h1 className="max-w-3xl font-display text-5xl leading-tight text-white md:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-white/62">{description}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card interactive={false} className="bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Realtime</div>
              <div className="mt-2 text-xl font-semibold text-sand">Storm sync</div>
            </Card>
            <Card interactive={false} className="bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Behavior</div>
              <div className="mt-2 text-xl font-semibold text-sand">Spice loops</div>
            </Card>
            <Card interactive={false} className="bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Growth</div>
              <div className="mt-2 text-xl font-semibold text-sand">Ascension</div>
            </Card>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-xl bg-white/6 p-6 md:p-8">
          {children}
          {footer ? <div className="mt-6 text-sm text-white/62">{footer}</div> : null}
        </Card>
      </div>
    </div>
  );
}
