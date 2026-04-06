"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { BLOOD_MARKERS, MARKER_CATEGORIES } from "@/constants/blood-markers";

interface BloodMarkerRowProps {
  index: number;
  name: string;
  value: string;
  unit: string;
  onNameChange: (name: string) => void;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function BloodMarkerRow({
  name,
  value,
  unit,
  onNameChange,
  onValueChange,
  onUnitChange,
  onRemove,
  canRemove,
}: BloodMarkerRowProps) {
  const t = useTranslations("analyze");

  const handleMarkerSelect = (selectedName: string | null) => {
    if (!selectedName) return;
    onNameChange(selectedName);
    const marker = BLOOD_MARKERS.find((m) => m.name === selectedName);
    if (marker) {
      onUnitChange(marker.unit);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/50 p-3 sm:space-y-0 sm:border-0 sm:p-0">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Select value={name} onValueChange={handleMarkerSelect}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectMarker")} />
            </SelectTrigger>
            <SelectContent>
              {MARKER_CATEGORIES.map((category) => (
                <SelectGroup key={category}>
                  <SelectLabel>{category}</SelectLabel>
                  {BLOOD_MARKERS.filter((m) => m.category === category).map(
                    (marker) => (
                      <SelectItem key={marker.name} value={marker.name}>
                        {marker.name}
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="shrink-0 sm:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            type="number"
            step="any"
            placeholder={t("enterValue")}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder={t("markerUnit")}
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
          />
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="hidden shrink-0 sm:flex"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
