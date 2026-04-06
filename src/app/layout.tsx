import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BloodTest AI - Understand Your Blood Tests in Minutes",
    template: "%s | BloodTest AI",
  },
  description:
    "Get clear, personalized explanations of your blood test results powered by AI. No account needed. Your data is never stored.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
