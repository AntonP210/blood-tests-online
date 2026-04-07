"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(name);
  }, [name]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = inputValue.toLowerCase();
  const filtered = query
    ? BLOOD_MARKERS.filter((m) => m.name.toLowerCase().includes(query))
    : BLOOD_MARKERS;

  const grouped = MARKER_CATEGORIES.map((cat) => ({
    category: cat,
    markers: filtered.filter((m) => m.category === cat),
  })).filter((g) => g.markers.length > 0);

  const handleSelect = (markerName: string) => {
    setInputValue(markerName);
    onNameChange(markerName);
    const marker = BLOOD_MARKERS.find((m) => m.name === markerName);
    if (marker) {
      onUnitChange(marker.unit);
    }
    setShowSuggestions(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onNameChange(val);
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/50 p-3 sm:space-y-0 sm:border-0 sm:p-0">
      <div className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1" ref={wrapperRef}>
          <Input
            placeholder={t("markerNamePlaceholder")}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && grouped.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
              {grouped.map((group) => (
                <div key={group.category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group.category}
                  </div>
                  {group.markers.map((marker) => (
                    <button
                      key={marker.name}
                      type="button"
                      onClick={() => handleSelect(marker.name)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      <span>{marker.name}</span>
                      <span className="text-xs text-muted-foreground">{marker.unit}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("removeMarker")}
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
            aria-label={t("removeMarker")}
            className="hidden shrink-0 sm:flex"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
