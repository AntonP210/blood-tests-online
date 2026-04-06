"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import type { PricingTier } from "@/constants/pricing";

interface PricingCardProps {
  tier: PricingTier;
  buttonLabel: string;
}

export function PricingCard({ tier, buttonLabel }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (tier.id === "free") return;

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.id }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card
      className={
        tier.popular
          ? "border-primary shadow-lg ring-1 ring-primary relative"
          : "relative"
      }
    >
      <CardHeader className="text-center p-6">
        {tier.badge && (
          <Badge className="mx-auto mb-2 w-fit">{tier.badge}</Badge>
        )}
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        <div className="mt-3">
          <span className="text-4xl font-bold">{tier.price}</span>
          {tier.period && (
            <span className="text-muted-foreground">{tier.period}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6 pt-0">
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          onClick={handleClick}
          disabled={tier.id === "free" || loading}
          variant={tier.popular ? "default" : "outline"}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : tier.id === "free" ? (
            "Current Plan"
          ) : (
            buttonLabel
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
