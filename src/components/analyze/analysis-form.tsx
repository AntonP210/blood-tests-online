"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { UserInfoForm } from "./user-info-form";
import { ManualEntryForm, type MarkerRow } from "./manual-entry-form";
import { FileUpload } from "./file-upload";
import { UsageIndicator } from "./usage-indicator";
import { UpgradeModal } from "./upgrade-modal";
import { useAnalysisStore } from "@/hooks/use-analysis";

const createEmptyMarkers = (): MarkerRow[] =>
  Array.from({ length: 3 }, () => ({
    id: crypto.randomUUID(),
    name: "",
    value: "",
    unit: "",
  }));

export function AnalysisForm() {
  const t = useTranslations("analyze");
  const tc = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();

  const { setResult, setLoading, setError, clear, isLoading, error } =
    useAnalysisStore();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [markers, setMarkers] = useState<MarkerRow[]>(createEmptyMarkers);
  const [fileData, setFileData] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const getValidationIssues = (): string[] => {
    const issues: string[] = [];
    if (!age) {
      issues.push(t("validationAge"));
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        issues.push(t("validationAgeRange"));
      }
    }
    if (!gender) issues.push(t("validationGender"));
    if (activeTab === "upload" && !fileData) {
      issues.push(t("validationFile"));
    }
    if (activeTab === "manual") {
      const filledMarkers = markers.filter((m) => m.name && m.value);
      if (filledMarkers.length === 0) {
        issues.push(t("validationMarkers"));
      } else {
        const incomplete = markers.filter(
          (m) => (m.name && !m.value) || (!m.name && m.value)
        );
        if (incomplete.length > 0) {
          issues.push(t("validationIncomplete"));
        }
      }
    }
    return issues;
  };

  const canSubmit = () => getValidationIssues().length === 0;

  const handleSubmit = async () => {
    setAttempted(true);
    if (!canSubmit()) return;

    clear();
    setLoading(true);

    try {
      const body =
        activeTab === "upload"
          ? {
              inputType: "file" as const,
              fileData: fileData!.data,
              mimeType: fileData!.mimeType,
              age: parseInt(age),
              gender,
              locale,
            }
          : {
              inputType: "manual" as const,
              markers: markers
                .filter((m) => m.name && m.value)
                .map((m) => ({
                  name: m.name,
                  value: parseFloat(m.value),
                  unit: m.unit,
                })),
              age: parseInt(age),
              gender,
              locale,
            };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Show upgrade modal on payment required (limit reached)
        if (response.status === 402) {
          setLoading(false);
          setShowUpgrade(true);
          return;
        }

        throw new Error(
          errorData?.error || `Analysis failed (${response.status})`
        );
      }

      const result = await response.json();
      setResult(result);
      router.push("/analyze/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const issues = attempted ? getValidationIssues() : [];

  return (
    <>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <UsageIndicator />

          <UserInfoForm
            age={age}
            gender={gender}
            onAgeChange={setAge}
            onGenderChange={setGender}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">{t("tabUpload")}</TabsTrigger>
              <TabsTrigger value="manual">{t("tabManual")}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <FileUpload
                onFileSelect={setFileData}
                onFileRemove={() => setFileData(null)}
                selectedFile={
                  fileData
                    ? { name: fileData.name, mimeType: fileData.mimeType }
                    : null
                }
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualEntryForm
                markers={markers}
                onMarkersChange={setMarkers}
              />
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {issues.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="mb-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
                {t("validationTitle")}
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700 dark:text-amber-300">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              tc("submit")
            )}
          </Button>
        </CardContent>
      </Card>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
