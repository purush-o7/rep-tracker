"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function platesPerSide(target: number, bar: number): number[] | null {
  let perSide = (target - bar) / 2;
  if (perSide < 0) return null;
  const result: number[] = [];
  for (const plate of PLATES) {
    while (perSide >= plate - 1e-9) {
      result.push(plate);
      perSide = Math.round((perSide - plate) * 100) / 100;
    }
  }
  return perSide > 0 ? null : result;
}

export function PlateCalculator({ initialWeight }: { initialWeight?: number }) {
  const [weight, setWeight] = useState<string>(
    initialWeight ? String(initialWeight) : ""
  );
  const [bar, setBar] = useState("20");

  const target = parseFloat(weight);
  const plates =
    target > 0 ? platesPerSide(target, parseFloat(bar)) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
        >
          <Calculator className="h-3 w-3" />
          Plates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <p className="text-sm font-medium">Plate calculator</p>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Total kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-9 text-base md:text-sm"
            step={2.5}
            min={0}
          />
          <Select value={bar} onValueChange={setBar}>
            <SelectTrigger className="h-9 w-28 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Bar 20 kg</SelectItem>
              <SelectItem value="15">Bar 15 kg</SelectItem>
              <SelectItem value="10">Bar 10 kg</SelectItem>
              <SelectItem value="0">No bar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {target > 0 && (
          <div className="rounded-md bg-muted/50 p-2 text-sm">
            {plates === null ? (
              <span className="text-muted-foreground">
                Can&apos;t be loaded exactly with standard plates
              </span>
            ) : plates && plates.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground">
                  Per side:
                </span>
                {plates.map((p, i) => (
                  <span
                    key={i}
                    className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Empty bar</span>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
