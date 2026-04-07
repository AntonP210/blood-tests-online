"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnalysisResult } from "@/types/blood-test";

interface AnalysisStore {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  setResult: (result: AnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set) => ({
      result: null,
      isLoading: false,
      error: null,
      setResult: (result) => set({ result, isLoading: false, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clear: () => set({ result: null, isLoading: false, error: null }),
    }),
    {
      name: "bloodwork-analysis",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ result: state.result }),
    }
  )
);
