"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { UserInfoForm } from "./user-info-form";
import { ManualEntryForm, type MarkerRow } from "./manual-entry-form";
import { FileUpload } from "./file-upload";
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

  const canSubmit = () => {
    if (!age || !gender) return false;
    if (activeTab === "upload") return fileData !== null;
    if (activeTab === "manual") {
      return markers.some((m) => m.name && m.value);
    }
    return false;
  };

  const handleSubmit = async () => {
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
            };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
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

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
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

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || isLoading}
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
  );
}
