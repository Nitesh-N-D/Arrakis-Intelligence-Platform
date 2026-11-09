import { forwardRef } from "react";

/** Text input with ARIA combobox semantics; the listbox it controls is rendered by CareerRoleSelector. */
const CareerSearchInput = forwardRef(function CareerSearchInput(
  { value, onChange, onKeyDown, listboxId, activeOptionId, expanded, label = "Search careers" },
  ref
) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`${listboxId}-input`}>{label}</label>
      <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24">
        <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
      <input
        ref={ref}
        id={`${listboxId}-input`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId || undefined}
        autoComplete="off"
        spellCheck="false"
        className="focus-ring w-full rounded-button border border-white/10 bg-[#0A0A0A] py-3 pl-10 pr-4 text-sm text-white placeholder:text-[#A1A1AA]"
        placeholder="Search 80+ careers, e.g. “SRE”, “data”, “security”"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
});

export default CareerSearchInput;
