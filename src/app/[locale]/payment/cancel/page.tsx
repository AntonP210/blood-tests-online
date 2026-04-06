"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const t = useTranslations("payment");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("cancelTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t("cancelMessage")}</p>
          <div className="flex flex-col gap-2">
            <Button render={<Link href="/pricing" />} className="w-full">
              {t("returnToPricing")}
            </Button>
            <Button
              render={<Link href="/analyze" />}
              variant="outline"
              className="w-full"
            >
              {t("tryFree")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
