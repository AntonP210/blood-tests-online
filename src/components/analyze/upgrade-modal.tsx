"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, X, Sparkles, Clock } from "lucide-react";
import { PRICING_TIERS } from "@/constants/pricing";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const DISCOUNT_MAP: Record<string, number> = {
  one_time: 15,
  weekly: 15,
  monthly: 25,
  yearly: 35,
  lifetime: 50,
};

function getDiscountedPrice(originalPrice: string, discountPercent: number): string {
  const num = parseFloat(originalPrice.replace("$", ""));
  const discounted = num * (1 - discountPercent / 100);
  return `$${discounted.toFixed(2)}`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const SHOWN_TIERS = ["one_time", "monthly", "yearly", "lifetime"];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const t = useTranslations("pricing");
  const tu = useTranslations("upgrade");
  const locale = useLocale();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [offerActive, setOfferActive] = useState<boolean | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const fetchOffer = useCallback(() => {
    fetch("/api/offer")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.active) {
          setOfferActive(true);
          setRemainingMs(data.remainingMs);
        } else {
          setOfferActive(false);
        }
      })
      .catch(() => setOfferActive(false));
  }, []);

  useEffect(() => {
    if (open) fetchOffer();
  }, [open, fetchOffer]);

  // Countdown timer
  useEffect(() => {
    if (!offerActive || remainingMs <= 0) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          setOfferActive(false);
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [offerActive, remainingMs]);

  if (!open) return null;

  const tiers = PRICING_TIERS.filter((tier) => SHOWN_TIERS.includes(tier.id));
  const showDiscount = offerActive === true;

  const handleCheckout = async (tierId: string) => {
    setLoadingTier(tierId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, locale }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">{tu("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tu("subtitle")}</p>

          {showDiscount && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <Clock className="h-3.5 w-3.5" />
              {tu("offerExpires", { time: formatCountdown(remainingMs) })}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {tiers.map((tier) => {
            const discount = showDiscount ? (DISCOUNT_MAP[tier.id] ?? 0) : 0;
            const discountedPrice = discount > 0
              ? getDiscountedPrice(tier.price, discount)
              : tier.price;

            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
                  tier.popular
                    ? "border-primary ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{t(tier.nameKey)}</h3>
                  {discount > 0 ? (
                    <Badge className="bg-red-100 text-red-700 text-xs font-semibold">
                      -{discount}%
                    </Badge>
                  ) : tier.badgeKey ? (
                    <Badge className="text-xs">{t(tier.badgeKey)}</Badge>
                  ) : null}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{discountedPrice}</span>
                  {discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">{tier.price}</span>
                  )}
                  {tier.period && (
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {tier.featureKeys.map((key) => (
                    <li key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loadingTier !== null}
                  variant={tier.popular ? "default" : "outline"}
                  className="mt-3 w-full"
                  size="sm"
                >
                  {loadingTier === tier.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tu("choosePlan")
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
