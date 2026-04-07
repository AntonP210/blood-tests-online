import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 sm:text-3xl sm:mb-8">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <p>
            Bloodwork Online is designed with your privacy as a top priority. While
            we require an account for authentication and usage tracking, we do
            not store your blood test data on our servers. This policy explains
            how we handle your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Data We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Account information:</strong> Your email address and
              authentication data are stored securely via Supabase to manage
              your account, usage limits, and payment status.
            </li>
          </ul>
          <h2 className="text-xl font-semibold text-foreground mt-4">
            Data We Do Not Collect
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>We do not store your blood test results</li>
            <li>We do not store uploaded images or PDFs</li>
            <li>We do not track your health information over time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            How Your Data Is Processed
          </h2>
          <p>
            When you submit blood test data for analysis, it is sent to
            Google&apos;s Gemini AI service for interpretation. The data is
            processed in real-time and is not stored by our application. Your
            results are displayed directly in your browser and exist only in your
            browser&apos;s memory until you navigate away or close the page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Authentication &amp; Cookies
          </h2>
          <p>
            We use secure authentication cookies managed by Supabase to maintain
            your session. We also use functional cookies to track your free
            analysis usage and payment status. These cookies do not contain any
            health information and are strictly necessary for the service to
            function.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Payment Information
          </h2>
          <p>
            Payments are processed securely through LemonSqueezy. We do not store
            your credit card details or financial information. Please refer to{" "}
            <a
              href="https://www.lemonsqueezy.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              LemonSqueezy&apos;s Privacy Policy
            </a>{" "}
            for details on how they handle payment data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Third-Party Services
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Google Gemini AI:</strong> Used to analyze and explain
              blood test results. Data is sent to Google&apos;s API for
              processing. See{" "}
              <a
                href="https://ai.google.dev/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google&apos;s AI Terms
              </a>
              .
            </li>
            <li>
              <strong>LemonSqueezy:</strong> Used for payment processing.
            </li>
            <li>
              <strong>Vercel:</strong> Used for hosting the application.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us
            through our website.
          </p>
        </section>

        <p className="text-xs text-muted-foreground/60 pt-4">
          Last updated: April 2026
        </p>
      </div>
    </div>
  );
}
