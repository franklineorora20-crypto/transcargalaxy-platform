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
  console.log("MANAGER EXPENSE VALIDATION TEST");
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
    .fill("JaredT");

  await page.getByRole("button", {
    name: "Sign In",
    exact: true
  }).click();

  await page.waitForTimeout(10000);

  console.log("✓ Manager authenticated");

  // FINANCIAL SECTION
  await page.getByRole("button", {
    name: "Financial Controls & Payroll",
    exact: true
  }).click();

  await page.waitForTimeout(1000);

  console.log("✓ Financial section opened");

  // OPEN EXPENSE FORM
  const expenseButton = page.getByRole("button", {
    name: "Record Operating Expense",
    exact: true
  });

  await expenseButton.click();

  await page.waitForTimeout(500);

  console.log("✓ Expense form opened");

  // FIND SAVE BUTTON
  const saveButton = page.getByRole("button", {
    name: "Save & Post to Ledger",
    exact: true
  });

  console.log(
    "\nSave button found:",
    await saveButton.count()
  );

  console.log(
    "Visible:",
    await saveButton.isVisible()
  );

  console.log(
    "Enabled:",
    await saveButton.isEnabled()
  );

  // CHECK REQUIRED FIELDS
  console.log("\n========== REQUIRED FIELD CHECK ==========");

  const requiredFields = await page
    .locator("input, select, textarea")
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();

          return (
            rect.width > 0 &&
            rect.height > 0
          );
        })
        .map((el) => ({
          tag: el.tagName,
          type: (el as HTMLInputElement).type || "",
          required: (el as HTMLInputElement).required,
          value: (el as HTMLInputElement).value || "",
          placeholder:
            (el as HTMLInputElement).placeholder || ""
        }))
    );

  console.table(requiredFields);

  // CLEAR DESCRIPTION AND REFERENCE
  const textInputs = page.locator(
    'input[type="text"]'
  );

  console.log(
    "\nText inputs:",
    await textInputs.count()
  );

  for (let i = 0; i < await textInputs.count(); i++) {
    await textInputs.nth(i).fill("");
  }

  // CLEAR AMOUNT
  const numberInput = page.locator(
    'input[type="number"]'
  );

  if (await numberInput.count() > 0) {
    await numberInput.first().fill("");
  }

  console.log(
    "✓ Required text/amount fields cleared"
  );

  // ATTEMPT INVALID SUBMISSION
  console.log(
    "\nAttempting submission with incomplete data..."
  );

  await saveButton.click();

  await page.waitForTimeout(1000);

  console.log(
    "✓ Invalid submission attempt completed"
  );

  // CHECK URL
  console.log(
    "Current URL:",
    page.url()
  );

  // CHECK FOR VALIDATION MESSAGES
  console.log(
    "\n========== VALIDATION MESSAGES =========="
  );

  const bodyText = await page.locator("body").innerText();

  const validationTerms = [
    "required",
    "invalid",
    "enter",
    "amount",
    "description",
    "reference"
  ];

  const foundTerms = validationTerms.filter(
    (term) =>
      bodyText.toLowerCase().includes(term)
  );

  if (foundTerms.length > 0) {
    console.log(
      "Validation-related text found:",
      foundTerms.join(", ")
    );
  } else {
    console.log(
      "No obvious validation message detected."
    );
  }

  // CHECK FORM STILL EXISTS
  const formStillVisible =
    await saveButton.isVisible().catch(() => false);

  console.log(
    "Save button still visible:",
    formStillVisible
  );

  // SCREENSHOT
  await page.screenshot({
    path:
      "test-results/manager-expense-validation.png",
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
    "test-results/manager-expense-validation.png"
  );

  console.log("\n========================================");
  console.log("EXPENSE VALIDATION TEST COMPLETE");
  console.log("========================================");

  await browser.close();
})();