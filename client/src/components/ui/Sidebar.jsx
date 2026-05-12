export default function Sidebar({ sections = [], plan = "free" }) {
  return (
    <aside className="hidden xl:block">
      <div className="glass-panel sticky top-6 space-y-5 p-5">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Arrakis</div>
          <div className="mt-2 font-display text-3xl text-white">Command deck</div>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Navigate the focus, storm, roadmap, and Mentat systems without losing context.
          </p>
        </div>

        <nav className="space-y-2">
          {sections.map((section) => (
            <a
              key={section.href}
              className="block rounded-card border border-border-subtle bg-white/4 px-4 py-3 transition hover:border-orange-300/20 hover:bg-white/8"
              href={section.href}
            >
              <div className="text-sm font-semibold text-white">{section.label}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.28em] text-white/40">
                {section.eyebrow}
              </div>
            </a>
          ))}
        </nav>

        <div className="rounded-card border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
          Plan: <span className="font-semibold uppercase">{plan}</span>
        </div>
      </div>
    </aside>
  );
}
