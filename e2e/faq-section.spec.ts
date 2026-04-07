import { test, expect } from "@playwright/test";

test.describe("FAQ section on landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    // Scroll to the FAQ section — it's below the fold
    const faqHeading = page.getByRole("heading", {
      name: /Questions\? We've Got Answers/i,
    });
    await faqHeading.scrollIntoViewIfNeeded();
  });

  test("displays FAQ title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Questions\? We've Got Answers/i })
    ).toBeVisible();
  });

  test("all 4 FAQ questions are visible", async ({ page }) => {
    // FAQ section has exactly 4 accordion buttons with aria-expanded
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const faqButtons = faqSection.locator("[aria-expanded]");
    await expect(faqButtons).toHaveCount(4);
  });

  test("all FAQs are collapsed by default", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const faqButtons = faqSection.locator("[aria-expanded]");
    const count = await faqButtons.count();

    for (let i = 0; i < count; i++) {
      await expect(faqButtons.nth(i)).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    }
  });

  test("clicking a question expands it", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const firstQuestion = faqSection.locator("[aria-expanded]").first();
    await firstQuestion.click();

    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

    // The answer region should be visible
    const region = faqSection.locator('[role="region"]');
    await expect(region).toBeVisible();
  });

  test("clicking an expanded question collapses it", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const firstQuestion = faqSection.locator("[aria-expanded]").first();

    // Expand
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

    // Collapse
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  });

  test("only one FAQ can be open at a time", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const faqButtons = faqSection.locator("[aria-expanded]");

    // Open the first FAQ
    await faqButtons.first().click();
    await expect(faqButtons.first()).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    // Open the second FAQ
    await faqButtons.nth(1).click();
    await expect(faqButtons.nth(1)).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    // First should now be collapsed
    await expect(faqButtons.first()).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("expanded FAQ shows answer with role=region", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const firstQuestion = faqSection.locator("[aria-expanded]").first();
    await firstQuestion.click();

    const region = faqSection.locator('[role="region"]');
    await expect(region).toBeVisible();
  });

  test("chevron icon rotates when FAQ is expanded", async ({ page }) => {
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", {
        name: /Questions\? We've Got Answers/i,
      }),
    });
    const firstQuestion = faqSection.locator("[aria-expanded]").first();

    // Before click — no rotation class
    const chevron = firstQuestion.locator("svg");
    await expect(chevron).not.toHaveClass(/rotate-180/);

    // After click — rotation class applied
    await firstQuestion.click();
    await expect(chevron).toHaveClass(/rotate-180/);
  });
});
