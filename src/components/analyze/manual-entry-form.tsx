"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BloodMarkerRow } from "./blood-marker-row";
import { Plus } from "lucide-react";

export interface MarkerRow {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface ManualEntryFormProps {
  markers: MarkerRow[];
  onMarkersChange: (markers: MarkerRow[]) => void;
}

export function ManualEntryForm({
  markers,
  onMarkersChange,
}: ManualEntryFormProps) {
  const t = useTranslations("analyze");

  const addMarker = () => {
    onMarkersChange([
      ...markers,
      { id: crypto.randomUUID(), name: "", value: "", unit: "" },
    ]);
  };

  const removeMarker = (index: number) => {
    onMarkersChange(markers.filter((_, i) => i !== index));
  };

  const updateMarker = (
    index: number,
    field: keyof MarkerRow,
    value: string
  ) => {
    const updated = [...markers];
    updated[index] = { ...updated[index], [field]: value };
    onMarkersChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">{t("manualTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("manualDescription")}
        </p>
      </div>

      <div className="space-y-3">
        {markers.map((marker, index) => (
          <BloodMarkerRow
            key={marker.id}
            index={index}
            name={marker.name}
            value={marker.value}
            unit={marker.unit}
            onNameChange={(name) => updateMarker(index, "name", name)}
            onValueChange={(value) => updateMarker(index, "value", value)}
            onUnitChange={(unit) => updateMarker(index, "unit", unit)}
            onRemove={() => removeMarker(index)}
            canRemove={markers.length > 1}
          />
        ))}
      </div>

      <Button variant="outline" onClick={addMarker} className="gap-2">
        <Plus className="h-4 w-4" />
        {t("addMarker")}
      </Button>
    </div>
  );
}
