"use client";

import { useState } from "react";
import { MapView } from "@/components/map/MapView";

export function ClickQuestionMap() {
  const [selected, setSelected] = useState(false);

  return (
    <button
      className="block w-full text-left"
      onClick={() => setSelected(true)}
      type="button"
    >
      <MapView className={selected ? "ring-2 ring-road ring-offset-2" : ""} />
      <p className="mt-2 text-sm text-slate-600">
        {selected
          ? "Placeholder map click captured."
          : "Tap the map area to simulate an answer."}
      </p>
    </button>
  );
}
