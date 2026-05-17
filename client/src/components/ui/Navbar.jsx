import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import ProfileDropdown from "./ProfileDropdown";
import RankBadge from "./RankBadge";
import UserAvatar from "./UserAvatar";

export default function Navbar({
  operative,
  billingPlan = "free",
  onBilling,
  onLogout,
  onMenu,
  onProfile,
  onSettings,
  onUpgrade
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="glass-panel sticky top-4 z-30 mb-6 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button className="xl:hidden" onClick={onMenu} variant="secondary">
              Menu
            </Button>
            <div>
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">
                Arrakis Intelligence Platform
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                {operative?.name || "Operative"} | {operative?.targetRole || "Discipline track"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <RankBadge rank={operative?.rank || operative?.currentRank || "Outworlder"} />
            <div className="rounded-full border border-border-subtle bg-white/5 px-4 py-2 text-sm text-white/70">
              Plan <span className="font-semibold uppercase text-amber-100">{billingPlan}</span>
            </div>
            {billingPlan !== "pro" ? <Button onClick={onUpgrade}>Upgrade</Button> : null}

            <div className="relative" ref={dropdownRef}>
              <button
                aria-expanded={menuOpen}
                className="focus-ring flex items-center gap-3 rounded-full border border-border-subtle bg-white/5 px-2 py-2 pr-4 transition hover:border-orange-300/25 hover:bg-white/8"
                onClick={() => setMenuOpen((current) => !current)}
                type="button"
              >
                <UserAvatar avatarUrl={operative?.avatarUrl} name={operative?.name} className="h-10 w-10" />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-semibold text-white">{operative?.name || "Operative"}</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">Account</div>
                </div>
              </button>

              <ProfileDropdown
                open={menuOpen}
                operative={operative}
                onBilling={onBilling}
                onClose={() => setMenuOpen(false)}
                onLogout={() => setConfirmLogout(true)}
                onProfile={onProfile}
                onSettings={onSettings}
              />
            </div>
          </div>
        </div>
      </header>

      <Modal
        description="This will end the current session on this browser and require a fresh login or Google sign-in."
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out of Arrakis?"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmLogout(false)} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setConfirmLogout(false);
              await onLogout?.();
            }}
          >
            Confirm Logout
          </Button>
        </div>
      </Modal>
    </>
  );
}
