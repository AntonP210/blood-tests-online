"use client";

import { ShieldCheck } from "lucide-react";

export function TrustBar() {
  return (
    <div className="bg-primary px-4 py-1.5 text-center text-sm font-medium text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        <p>We never store your health data. Not now, not ever.</p>
      </div>
    </div>
  );
}
