"use client";
import { cn } from "@/lib/utils";
import { CREATIVE_STATES, type CreativeState } from "@/types/nectary";
import { CREATIVE_STATE_STYLES } from "@/lib/nectary-styles";

interface CreativeStateToggleProps {
  value: CreativeState;
  onChange: (state: CreativeState) => void;
  className?: string;
}

const ORDER: CreativeState[] = ["flow", "mild", "severe"];

export function CreativeStateToggle({ value, onChange, className }: CreativeStateToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Creative state"
      className={cn(
        "flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1",
        className,
      )}
    >
      {ORDER.map((state) => {
        const meta = CREATIVE_STATES[state];
        const styles = CREATIVE_STATE_STYLES[state];
        const isActive = value === state;
        return (
          <button
            key={state}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(state)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? cn("bg-card shadow-soft", styles.text)
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full transition-transform",
                styles.dot,
                isActive && "animate-pulse",
              )}
            />
            <span className="inline">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
