export default function GlassCard({ className = "", children }) {
  return <div className={`glass-panel p-6 ${className}`}>{children}</div>;
}
