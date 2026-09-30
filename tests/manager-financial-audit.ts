import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1366,
      height: 768
    }
  });

  const errors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} -> ${
        request.failure()?.errorText || "unknown"
      }`
    );
  });

  console.log("\n========================================");
  console.log("TRANSCAR GALAXY");
  console.log("MANAGER FINANCIAL AUDIT");
  console.log("========================================");

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  await page.goto(
    "http://localhost:3000/manager/login",
    {
      waitUntil: "networkidle"
    }
  );

  await page.getByRole("button", {
    name: "Manager Login",
    exact: true
  }).click();

  await page.waitForTimeout(500);

  await page
    .locator('input[placeholder="admintranscar"]')
    .fill("manager@transcargalaxy.com");

  await page
    .locator('input[type="password"]')
    .fill(process.env.INITIAL_MANAGER_PASSWORD || "");

  await page.getByRole("button", {
    name: "Sign In",
    exact: true
  }).click();

  await page.waitForTimeout(10000);

  console.log("\n✓ Manager authenticated");

  // --------------------------------------------------
  // OPEN FINANCIAL SECTION
  // --------------------------------------------------

  const financialButton =
    page.getByRole("button", {
      name: "Financial Controls & Payroll",
      exact: true
    });

  console.log(
    "\nFinancial button found:",
    await financialButton.count()
  );

  console.log(
    "Visible:",
    await financialButton.isVisible()
  );

  console.log(
    "Enabled:",
    await financialButton.isEnabled()
  );

  await financialButton.click();

  await page.waitForTimeout(1000);

  // --------------------------------------------------
  // PAGE CONTENT
  // --------------------------------------------------

  const bodyText =
    await page.locator("body").innerText();

  console.log(
    "\n========== FINANCIAL CONTENT =========="
  );

  const financialTerms = [
    "Revenue",
    "Expenses",
    "Expense",
    "Payments",
    "Payroll",
    "Financial"
  ];

  for (const term of financialTerms) {
    console.log(
      `${bodyText
        .toLowerCase()
        .includes(term.toLowerCase())
        ? "✓"
        : "❌"} ${term}`
    );
  }

  // --------------------------------------------------
  // HEADINGS
  // --------------------------------------------------

  console.log(
    "\n========== FINANCIAL HEADINGS =========="
  );

  const headings =
    await page
      .locator("h1,h2,h3,h4")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0
            );
          })
          .map((el) =>
            (el.textContent || "").trim()
          )
          .filter(Boolean)
      );

  console.table(headings);

  // --------------------------------------------------
  // BUTTONS
  // --------------------------------------------------

  console.log(
    "\n========== FINANCIAL BUTTONS =========="
  );

  const buttons =
    await page
      .locator("button")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0
            );
          })
          .map((el, index) => ({
            "#": index + 1,
            text:
              (
                el.textContent ||
                ""
              ).trim() || "[NO TEXT]",
            disabled:
              (el as HTMLButtonElement)
                .disabled
          }))
      );

  console.table(buttons);

  // --------------------------------------------------
  // INPUTS / FORMS
  // --------------------------------------------------

  console.log(
    "\n========== FINANCIAL INPUTS =========="
  );

  const inputs =
    await page
      .locator("input,select,textarea")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0
            );
          })
          .map((el, index) => ({
            "#": index + 1,
            tag: el.tagName,
            type:
              (el as HTMLInputElement).type ||
              "",
            placeholder:
              (el as HTMLInputElement)
                .placeholder || ""
          }))
      );

  console.table(inputs);

  // --------------------------------------------------
  // SCREENSHOT
  // --------------------------------------------------

  await page.screenshot({
    path:
      "test-results/manager-financial-audit.png",
    fullPage: true
  });

  // --------------------------------------------------
  // ERRORS
  // --------------------------------------------------

  console.log(
    "\n========== CONSOLE ERRORS =========="
  );

  if (errors.length === 0) {
    console.log("✓ No console errors");
  } else {
    console.table(errors);
  }

  console.log(
    "\n========== FAILED REQUESTS =========="
  );

  if (failedRequests.length === 0) {
    console.log(
      "✓ No failed network requests"
    );
  } else {
    console.table(failedRequests);
  }

  console.log("\nScreenshot:");
  console.log(
    "test-results/manager-financial-audit.png"
  );

  console.log("\n========================================");
  console.log("FINANCIAL AUDIT COMPLETE");
  console.log("========================================");

  await browser.close();
})();