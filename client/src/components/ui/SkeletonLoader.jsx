export default function SkeletonLoader({ className = "h-6 w-full" }) {
  return <div className={`animate-pulse rounded-button bg-white/8 ${className}`} />;
}
