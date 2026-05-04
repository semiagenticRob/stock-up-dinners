"use client";

import { useState } from "react";
import type { Ingredient } from "@/lib/types";
import { QuickPantryAdd } from "./QuickPantryAdd";
import { AddLotForm } from "./AddLotForm";

interface Props {
  ingredients: Ingredient[];
}

export function PantryAddView({ ingredients }: Props) {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");

  return (
    <div className="pantry-add-view">
      <div className="pantry-add-view__tabs">
        <button
          type="button"
          className={`pantry-add-view__tab ${mode === "quick" ? "pantry-add-view__tab--active" : ""}`}
          onClick={() => setMode("quick")}
        >
          Visual quick-add
        </button>
        <button
          type="button"
          className={`pantry-add-view__tab ${mode === "detailed" ? "pantry-add-view__tab--active" : ""}`}
          onClick={() => setMode("detailed")}
        >
          Detailed entry
        </button>
      </div>
      {mode === "quick" ? (
        <QuickPantryAdd ingredients={ingredients} />
      ) : (
        <AddLotForm ingredients={ingredients} />
      )}
    </div>
  );
}
