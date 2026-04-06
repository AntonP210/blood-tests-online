import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PrivacySection } from "@/components/landing/privacy-section";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { FAQSection } from "@/components/landing/faq-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PrivacySection />
      <HowItWorks />
      <PricingPreview />
      <FAQSection />
    </>
  );
}
