import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button";
import UserAvatar from "./UserAvatar";

const menuButtonClassName =
  "w-full rounded-button border border-border-subtle bg-white/4 px-4 py-3 text-left text-sm text-white/72 transition hover:border-orange-300/20 hover:bg-white/8 hover:text-white";

export default function ProfileDropdown({ open, operative, onClose, onLogout, onProfile, onSettings }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          aria-label="Account menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[18rem] rounded-card border border-border-subtle bg-black/90 p-4 shadow-card backdrop-blur-glass"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
        >
          <div className="flex items-center gap-3 rounded-card border border-border-subtle bg-white/4 p-3">
            <UserAvatar avatarUrl={operative?.avatarUrl} name={operative?.name} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{operative?.name || "Operative"}</div>
              <div className="truncate text-sm text-white/55">{operative?.email || "No email"}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <button className={menuButtonClassName} onClick={() => { onProfile?.(); onClose?.(); }} type="button">
              Profile
            </button>
            <button className={menuButtonClassName} onClick={() => { onSettings?.(); onClose?.(); }} type="button">
              Settings
            </button>
          </div>

          <Button className="mt-4 w-full" onClick={() => { onLogout?.(); onClose?.(); }} variant="ghost">
            Logout
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
