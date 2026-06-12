"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LogType } from "@/lib/types";
import type { SetEntry } from "@/lib/set-entry";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step: number;
  placeholder: string;
  inputMode: "numeric" | "decimal";
  suffix?: string;
}

function Stepper({
  value,
  onChange,
  step,
  placeholder,
  inputMode,
  suffix,
}: StepperProps) {
  const bump = (delta: number) => {
    const next = Math.max(0, Math.round((value + delta) * 100) / 100);
    onChange(next);
  };

  return (
    <div className="flex h-10 flex-1 items-center overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        className="flex h-full w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        onClick={() => bump(-step)}
        tabIndex={-1}
        aria-label={`decrease by ${step}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value || ""}
        min={0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-full w-full min-w-0 border-x bg-transparent text-center text-base outline-none md:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="px-1 text-[10px] text-muted-foreground">{suffix}</span>
      )}
      <button
        type="button"
        className="flex h-full w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        onClick={() => bump(step)}
        tabIndex={-1}
        aria-label={`increase by ${step}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface SetInputRowProps {
  index: number;
  logType: LogType;
  entry: SetEntry;
  onChange: (patch: Partial<SetEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetInputRow({
  index,
  logType,
  entry,
  onChange,
  onRemove,
  canRemove,
}: SetInputRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 shrink-0 text-center text-sm text-muted-foreground">
        {index + 1}
      </span>
      {logType === "weight_reps" && (
        <>
          <Stepper
            value={entry.reps}
            onChange={(v) => onChange({ reps: Math.round(v) })}
            step={1}
            placeholder="reps"
            inputMode="numeric"
          />
          <Stepper
            value={entry.weight_kg}
            onChange={(v) => onChange({ weight_kg: v })}
            step={2.5}
            placeholder="kg"
            inputMode="decimal"
          />
        </>
      )}
      {logType === "duration" && (
        <Stepper
          value={entry.duration_seconds}
          onChange={(v) => onChange({ duration_seconds: Math.round(v) })}
          step={15}
          placeholder="seconds"
          inputMode="numeric"
          suffix="sec"
        />
      )}
      {logType === "distance" && (
        <Stepper
          value={entry.distance_m}
          onChange={(v) => onChange({ distance_m: Math.round(v) })}
          step={250}
          placeholder="meters"
          inputMode="numeric"
          suffix="m"
        />
      )}
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onRemove}
        >
          <Minus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
