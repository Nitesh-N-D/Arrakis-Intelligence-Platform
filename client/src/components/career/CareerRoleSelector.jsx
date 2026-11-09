import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CUSTOM_ROLE_ID } from "../../data/careerRoles.js";
import useDialogFocus from "../../hooks/useDialogFocus";
import { cx } from "../../utils/cx";
import CareerCategoryTabs from "./CareerCategoryTabs";
import CareerRoleCard from "./CareerRoleCard";
import CareerSearchInput from "./CareerSearchInput";
import CareerSummaryCard from "./CareerSummaryCard";
import CustomCareerForm from "./CustomCareerForm";
import { ALL_CATEGORY, buildOptions, nextActiveIndex, selectionTitle } from "./careerSelectorModel";

function useIsDesktop() {
  const query = "(min-width: 768px)";
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches !== false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return desktop;
}

/**
 * The single career selector used by registration, onboarding and the profile.
 * Desktop: an anchored popover. Mobile: a full-height modal sheet.
 * The listbox follows the ARIA combobox pattern (arrows, Home/End, Enter, Escape).
 */
export default function CareerRoleSelector({ value, onChange, errors = {}, label = "Target career", idPrefix = "career" }) {
  const uid = useId().replace(/:/g, "");
  const listboxId = `${idPrefix}-${uid}-listbox`;
  const desktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const listRef = useRef(null);

  const options = useMemo(() => buildOptions(query, category), [query, category]);
  const title = selectionTitle(value);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const sheetRef = useDialogFocus(open && !desktop, () => close());

  useEffect(() => { setActiveIndex(options.length > 1 ? 0 : -1); }, [options]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    if (!desktop) return () => cancelAnimationFrame(frame);
    const onPointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, desktop, close]);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector(`#${CSS.escape(`${listboxId}-opt-${activeIndex}`)}`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, listboxId]);

  const choose = (option) => {
    if (option.type === "custom") {
      onChange({
        ...value,
        roleId: CUSTOM_ROLE_ID,
        customTitle: option.title || (value.roleId === CUSTOM_ROLE_ID ? value.customTitle : ""),
        customSkills: value.roleId === CUSTOM_ROLE_ID ? value.customSkills : []
      });
    } else {
      onChange({ ...value, roleId: option.id });
    }
    setQuery("");
    close();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) choose(options[activeIndex]);
      return;
    }
    const next = nextActiveIndex(event.key, activeIndex, options.length);
    if (next !== null) {
      event.preventDefault();
      setActiveIndex(next);
    }
  };

  const roleCount = options.length - 1;
  const panel = (
    <div className="flex h-full flex-col gap-3">
      <CareerSearchInput
        ref={inputRef}
        activeOptionId={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : null}
        expanded={open}
        listboxId={listboxId}
        value={query}
        onChange={setQuery}
        onKeyDown={onKeyDown}
      />
      <CareerCategoryTabs value={category} onChange={(next) => { setCategory(next); inputRef.current?.focus(); }} />
      <p aria-live="polite" className="sr-only">{roleCount} careers found</p>
      <ul
        ref={listRef}
        aria-label="Careers"
        className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 md:max-h-80"
        id={listboxId}
        role="listbox"
      >
        {options.map((option, index) => (
          <CareerRoleCard
            key={`${option.type}-${option.id}`}
            active={index === activeIndex}
            id={`${listboxId}-opt-${index}`}
            option={option}
            selected={option.type === "custom" ? value.roleId === CUSTOM_ROLE_ID : value.roleId === option.id}
            onHover={() => setActiveIndex(index)}
            onSelect={() => choose(option)}
          />
        ))}
      </ul>
      {roleCount === 0 ? <p className="px-1 text-xs text-[#A1A1AA]">No catalogue match. You can continue with a custom role.</p> : null}
    </div>
  );

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.16 } };

  return (
    <div className="grid gap-3">
      <div className="relative">
        <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45" id={`${listboxId}-label`}>{label}</label>
        <button
          ref={triggerRef}
          aria-describedby={errors.role ? `${listboxId}-error` : undefined}
          aria-expanded={open}
          aria-haspopup={desktop ? "listbox" : "dialog"}
          aria-labelledby={`${listboxId}-label ${listboxId}-value`}
          className={cx(
            "focus-ring flex w-full items-center justify-between gap-3 rounded-button border bg-black/20 px-4 py-3 text-left text-sm transition",
            errors.role ? "border-red-300/40" : "border-white/10 hover:border-white/20"
          )}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
        >
          <span className={title ? "text-white" : "text-[#A1A1AA]"} id={`${listboxId}-value`}>
            {title || (value.roleId === CUSTOM_ROLE_ID ? "Custom role" : "Choose a career")}
          </span>
          <svg aria-hidden="true" className={cx("h-4 w-4 text-[#A1A1AA] transition", open && "rotate-180")} fill="none" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </button>
        {errors.role ? <p className="mt-1 text-xs text-red-200" id={`${listboxId}-error`}>{errors.role}</p> : null}

        <AnimatePresence>
          {open && desktop ? (
            <motion.div
              ref={popoverRef}
              className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#141414]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              {...motionProps}
            >
              {panel}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && !desktop ? (
          <motion.div
            aria-labelledby={`${listboxId}-sheet-title`}
            aria-modal="true"
            className="fixed inset-0 z-[80] flex flex-col bg-[#0A0A0A]/98 px-4 pb-4 pt-3"
            role="dialog"
            {...motionProps}
          >
            <div ref={sheetRef} className="flex min-h-0 flex-1 flex-col" tabIndex={-1}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg text-white" id={`${listboxId}-sheet-title`}>Choose a career</h2>
                <button className="focus-ring rounded-button px-3 py-2 text-sm text-[#A1A1AA] hover:text-white" type="button" onClick={() => close()}>
                  Close
                </button>
              </div>
              {panel}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {value.roleId === CUSTOM_ROLE_ID ? (
        <div className="rounded-2xl border border-white/10 bg-[#141414]/80 p-4">
          <CustomCareerForm errors={errors} idPrefix={`${idPrefix}-custom`} selection={value} onChange={onChange} />
        </div>
      ) : (
        <CareerSummaryCard selection={value} />
      )}
    </div>
  );
}
