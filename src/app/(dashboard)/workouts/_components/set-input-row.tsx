"use client";

import { Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SetInputRowProps {
  index: number;
  reps: number;
  weight: number;
  onRepsChange: (value: number) => void;
  onWeightChange: (value: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetInputRow({
  index,
  reps,
  weight,
  onRepsChange,
  onWeightChange,
  onRemove,
  canRemove,
}: SetInputRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-center text-sm text-muted-foreground">
        {index + 1}
      </span>
      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Reps"
        value={reps || ""}
        onChange={(e) => onRepsChange(Number(e.target.value))}
        className="w-20 text-base md:text-sm"
        min={1}
      />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight || ""}
        onChange={(e) => onWeightChange(Number(e.target.value))}
        className="w-20 text-base md:text-sm"
        min={0}
        step={0.5}
      />
      <span className="text-sm text-muted-foreground">kg</span>
      {canRemove && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
          <Minus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
