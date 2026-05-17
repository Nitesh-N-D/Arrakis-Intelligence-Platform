export default function UserAvatar({ name = "Operative", avatarUrl = "", className = "h-11 w-11" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OP";

  if (avatarUrl) {
    return (
      <img
        alt={name}
        className={`${className} rounded-full border border-border-subtle object-cover`}
        src={avatarUrl}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full border border-amber-300/20 bg-gradient-to-br from-orange-500/30 to-yellow-400/20 text-sm font-semibold text-amber-50`}
    >
      {initials}
    </div>
  );
}
