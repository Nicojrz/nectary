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
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary/60 p-0.5",
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
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? cn("bg-card shadow-soft", styles.text)
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-transform",
                styles.dot,
                isActive && "animate-pulse",
              )}
            />
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}


