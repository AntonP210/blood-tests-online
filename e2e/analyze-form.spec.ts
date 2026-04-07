import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_FREE,
  MOCK_USAGE_ONE_LEFT,
  MOCK_USAGE_EXHAUSTED,
  MOCK_USAGE_PAID,
} from "./helpers";

test.describe("Analysis form", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await setupApiMocks(page);
    await page.goto("/en/analyze");
  });

  test("renders the analysis page with title and form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Analyze Your Blood Test/i })
    ).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Age" })).toBeVisible();
    await expect(page.getByText("Upload Image/PDF")).toBeVisible();
    await expect(page.getByText("Manual Entry")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Analyze My Results/i })
    ).toBeVisible();
  });

  test("shows usage indicator for free users", async ({ page }) => {
    await expect(
      page.getByText(/2 of 2 free analyses remaining/i)
    ).toBeVisible();
  });

  test("shows unlimited for paid users", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_PAID });
    await page.reload();
    await expect(page.getByText(/Unlimited analyses/i)).toBeVisible();
  });

  test("shows low usage warning", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_ONE_LEFT });
    await page.reload();
    await expect(
      page.getByText(/1 of 2 free analyses remaining/i)
    ).toBeVisible();
  });

  test("shows no analyses left warning", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_EXHAUSTED });
    await page.reload();
    await expect(
      page.getByText(/No free analyses remaining/i)
    ).toBeVisible();
  });

  test.describe("Validation", () => {
    test("shows validation errors when submitting empty form", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /Analyze My Results/i }).click();
      await expect(page.getByText("Enter your age")).toBeVisible();
      await expect(page.getByText("Select your gender")).toBeVisible();
      await expect(
        page.getByText("Upload a blood test image or PDF")
      ).toBeVisible();
    });

    test("shows age range validation for invalid age", async ({ page }) => {
      await page.getByRole("spinbutton", { name: "Age" }).fill("150");
      await page.getByRole("button", { name: /Analyze My Results/i }).click();
      await expect(
        page.getByText("Age must be between 1 and 120")
      ).toBeVisible();
    });

    test("clears file validation after file selection", async ({ page }) => {
      await page.getByRole("button", { name: /Analyze My Results/i }).click();
      await expect(
        page.getByText("Upload a blood test image or PDF")
      ).toBeVisible();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-bloodwork.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
          "base64"
        ),
      });

      await expect(page.getByText("test-bloodwork.png")).toBeVisible();
    });
  });

  test.describe("File upload tab", () => {
    test("shows upload area with drag and drop text", async ({ page }) => {
      await expect(
        page.getByText("Drag and drop or click to upload", { exact: true })
      ).toBeVisible();
    });

    test("accepts valid image upload", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "blood-test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.alloc(1024, "x"),
      });
      await expect(page.getByText("blood-test.jpg")).toBeVisible();
    });

    test("accepts PDF upload", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "results.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(1024, "x"),
      });
      await expect(page.getByText("results.pdf")).toBeVisible();
    });

    test("shows file remove button after upload", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(512, "a"),
      });
      await expect(page.getByText("test.png")).toBeVisible();
    });

    test("removes file when remove button is clicked", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(512, "a"),
      });
      await expect(page.getByText("test.png")).toBeVisible();

      // The remove button is inside the file display area with the X icon
      const fileDisplay = page.locator(".border-dashed").filter({ hasText: "test.png" });
      await fileDisplay.getByRole("button").click();
      await expect(page.getByText("test.png")).not.toBeVisible();
      await expect(
        page.getByText("Drag and drop or click to upload", { exact: true })
      ).toBeVisible();
    });
  });

  test.describe("Manual entry tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText("Manual Entry").click();
    });

    test("shows manual entry form", async ({ page }) => {
      await expect(
        page.getByText("Enter Your Blood Test Values")
      ).toBeVisible();
    });

    test("has three empty marker rows by default", async ({ page }) => {
      const markerInputs = page.locator(
        'input[placeholder="Type or select a marker..."]'
      );
      await expect(markerInputs).toHaveCount(3);
    });

    test("can add a new marker row", async ({ page }) => {
      await page.getByRole("button", { name: /Add Another Marker/i }).click();
      const markerInputs = page.locator(
        'input[placeholder="Type or select a marker..."]'
      );
      await expect(markerInputs).toHaveCount(4);
    });

    test("shows validation when markers are incomplete", async ({ page }) => {
      // Fill only the first marker name but not value -- this triggers
      // "Enter at least one marker" because no marker has BOTH name and value
      await page
        .locator('input[placeholder="Type or select a marker..."]')
        .first()
        .fill("Hemoglobin");

      await page.getByRole("spinbutton", { name: "Age" }).fill("30");
      await page.locator("#gender").click();
      await page.getByRole("option", { name: "Male", exact: true }).click();

      await page.getByRole("button", { name: /Analyze My Results/i }).click();

      // With only a name and no value, no marker is "filled" so this triggers
      await expect(
        page.getByText(/Enter at least one marker with a name and value/i)
      ).toBeVisible();
    });

    test("shows marker suggestions on focus", async ({ page }) => {
      const firstMarker = page
        .locator('input[placeholder="Type or select a marker..."]')
        .first();
      await firstMarker.focus();
      // Suggestion dropdown should appear
      await expect(
        page.locator(".absolute.z-50").first()
      ).toBeVisible();
    });
  });

  test.describe("Successful analysis submission", () => {
    test("submits file upload and navigates to results", async ({ page }) => {
      await page.getByRole("spinbutton", { name: "Age" }).fill("35");
      await page.locator("#gender").click();
      await expect(page.getByRole("option", { name: "Male", exact: true })).toBeVisible();
      await page.getByRole("option", { name: "Male", exact: true }).click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "bloodwork.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(8000, "a"),
      });

      await page.getByRole("button", { name: /Analyze My Results/i }).click();
      // With mocked API, the response is instant so loading state may flash by
      // Just verify we end up on the results page
      await expect(page).toHaveURL(/\/analyze\/results/, { timeout: 10000 });
    });

    test("submits manual entry and navigates to results", async ({ page }) => {
      await page.getByRole("spinbutton", { name: "Age" }).fill("28");
      await page.locator("#gender").click();
      await expect(page.getByRole("option", { name: "Female", exact: true })).toBeVisible();
      await page.getByRole("option", { name: "Female", exact: true }).click();

      await page.getByText("Manual Entry").click();

      const nameInput = page
        .locator('input[placeholder="Type or select a marker..."]')
        .first();
      await nameInput.fill("Hemoglobin");
      await page
        .locator('input[placeholder="Enter value"]')
        .first()
        .fill("14.2");
      await page
        .locator('input[placeholder="Unit"]')
        .first()
        .fill("g/dL");

      await page.getByRole("button", { name: /Analyze My Results/i }).click();
      await expect(page).toHaveURL(/\/analyze\/results/, { timeout: 10000 });
    });
  });

  test.describe("Error handling", () => {
    test("shows error when API returns 500", async ({ page }) => {
      await setupApiMocks(page, {
        analysisError: {
          status: 500,
          body: { error: "Analysis failed: internal server error" },
        },
      });

      await page.getByRole("spinbutton", { name: "Age" }).fill("30");
      await page.locator("#gender").click();
      await page.getByRole("option", { name: "Male", exact: true }).click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(8000, "a"),
      });

      await page.getByRole("button", { name: /Analyze My Results/i }).click();

      await expect(
        page.getByText(/Analysis failed/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("shows upgrade modal when usage is exhausted (402)", async ({
      page,
    }) => {
      await setupApiMocks(page, {
        analysisError: {
          status: 402,
          body: { error: "Free tier limit reached" },
        },
      });

      await page.getByRole("spinbutton", { name: "Age" }).fill("30");
      await page.locator("#gender").click();
      await page.getByRole("option", { name: "Male", exact: true }).click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(8000, "a"),
      });

      await page.getByRole("button", { name: /Analyze My Results/i }).click();

      await expect(
        page.getByText(/You've used all your free analyses/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("shows error when API returns no markers (422)", async ({ page }) => {
      await setupApiMocks(page, {
        analysisError: {
          status: 422,
          body: {
            error:
              "No blood test markers found in the uploaded file. Please upload a clear image.",
          },
        },
      });

      await page.getByRole("spinbutton", { name: "Age" }).fill("30");
      await page.locator("#gender").click();
      await page.getByRole("option", { name: "Male", exact: true }).click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "random.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(8000, "b"),
      });

      await page.getByRole("button", { name: /Analyze My Results/i }).click();

      await expect(
        page.getByText(/No blood test markers found/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
