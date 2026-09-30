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
  console.log("MANAGER EXPENSE FORM TEST");
  console.log("========================================");

  // LOGIN
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

  // OPEN FINANCIAL SECTION
  await page.getByRole("button", {
    name: "Financial Controls & Payroll",
    exact: true
  }).click();

  await page.waitForTimeout(1000);

  console.log("\n✓ Financial section loaded");

  // FIND EXPENSE BUTTON
  const expenseButton =
    page.getByRole("button", {
      name: "Record Operating Expense",
      exact: true
    });

  console.log(
    "Record Operating Expense found:",
    await expenseButton.count()
  );

  console.log(
    "Visible:",
    await expenseButton.isVisible()
  );

  console.log(
    "Enabled:",
    await expenseButton.isEnabled()
  );

  // OPEN FORM
  console.log(
    "\nClicking Record Operating Expense..."
  );

  await expenseButton.click();

  await page.waitForTimeout(500);

  // INSPECT INPUTS
  console.log(
    "\n========== FORM INPUTS =========="
  );

  const inputs =
    await page
      .locator(
        "input, select, textarea"
      )
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
            name:
              (el as HTMLInputElement).name ||
              "",
            placeholder:
              (el as HTMLInputElement)
                .placeholder || "",
            value:
              (el as HTMLInputElement)
                .value || ""
          }))
      );

  console.table(inputs);

  // INSPECT VISIBLE BUTTONS
  console.log(
    "\n========== FORM BUTTONS =========="
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
            type:
              (el as HTMLButtonElement).type,
            disabled:
              (el as HTMLButtonElement).disabled
          }))
      );

  console.table(buttons);

  // SCREENSHOT
  await page.screenshot({
    path:
      "test-results/manager-expense-form.png",
    fullPage: true
  });

  // ERRORS
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

  console.log(
    "\nScreenshot:"
  );

  console.log(
    "test-results/manager-expense-form.png"
  );

  console.log("\n========================================");
  console.log("EXPENSE FORM TEST COMPLETE");
  console.log("========================================");

  await browser.close();
})();