"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">{t("somethingWentWrong")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("unexpectedError")}
      </p>
      <Button onClick={onReset} variant="outline">
        {t("tryAgain")}
      </Button>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback onReset={() => this.setState({ hasError: false })} />
      );
    }

    return this.props.children;
  }
}
