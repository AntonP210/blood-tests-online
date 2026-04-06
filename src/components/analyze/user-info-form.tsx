"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserInfoFormProps {
  age: string;
  gender: string;
  onAgeChange: (age: string) => void;
  onGenderChange: (gender: string) => void;
}

export function UserInfoForm({
  age,
  gender,
  onAgeChange,
  onGenderChange,
}: UserInfoFormProps) {
  const t = useTranslations("analyze");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="age">{t("ageLabel")}</Label>
        <Input
          id="age"
          type="number"
          min={1}
          max={120}
          placeholder={t("agePlaceholder")}
          value={age}
          onChange={(e) => onAgeChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">{t("genderLabel")}</Label>
        <Select value={gender} onValueChange={(v) => v && onGenderChange(v)}>
          <SelectTrigger id="gender">
            <SelectValue placeholder={t("genderLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{t("genderMale")}</SelectItem>
            <SelectItem value="female">{t("genderFemale")}</SelectItem>
            <SelectItem value="other">{t("genderOther")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
