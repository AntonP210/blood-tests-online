"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const t = useTranslations("payment");
  const tv = useTranslations("paymentVerification");

  const [status, setStatus] = useState<"loading" | "verified" | "failed">(
    "loading"
  );

  useEffect(() => {
    // Poll a few times — webhook may arrive slightly after redirect
    let attempts = 0;
    const maxAttempts = 5;

    const check = () => {
      fetch("/api/checkout/verify")
        .then((res) => res.json())
        .then((data) => {
          if (data.verified) {
            setStatus("verified");
          } else if (++attempts < maxAttempts) {
            setTimeout(check, 2000);
          } else {
            setStatus("failed");
          }
        })
        .catch(() => setStatus("failed"));
    };

    check();
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">{tv("verifying")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">{tv("notVerifiedTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {tv("notVerifiedMessage")}
            </p>
            <Button
              render={<Link href="/pricing" />}
              variant="outline"
              className="w-full"
            >
              {t("returnToPricing")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t("successMessage")}</p>
          <Button render={<Link href="/analyze" />} className="w-full">
            {t("startAnalyzing")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
