export default function GlassCard({ className = "", children }) {
  return <div className={`glass-panel rounded-3xl p-6 ${className}`}>{children}</div>;
}
