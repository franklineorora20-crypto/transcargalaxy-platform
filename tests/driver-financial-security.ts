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
  console.log("DRIVER FINANCIAL SECURITY TEST");
  console.log("========================================");

  // --------------------------------------------------
  // OPEN DRIVER LOGIN PAGE
  // --------------------------------------------------

  await page.goto(
    "http://localhost:3000/driver/login",
    {
      waitUntil: "networkidle"
    }
  );

  console.log(
    "\nDriver login page:",
    page.url()
  );

  // --------------------------------------------------
  // REVEAL DRIVER LOGIN FORM
  // --------------------------------------------------

  const driverLoginButton =
    page.getByRole("button", {
      name: "Driver Login",
      exact: true
    });

  console.log(
    "Driver Login button found:",
    await driverLoginButton.count()
  );

  if (await driverLoginButton.count() === 0) {
    throw new Error(
      "Driver Login button was not found."
    );
  }

  await driverLoginButton.click();

  await page.waitForTimeout(500);

  console.log(
    "✓ Driver login form revealed"
  );

  // --------------------------------------------------
  // INSPECT LOGIN INPUTS
  // --------------------------------------------------

  const inputs = await page
    .locator("input")
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
        .map((el) => ({
          type:
            (el as HTMLInputElement).type,
          placeholder:
            (el as HTMLInputElement).placeholder,
          name:
            (el as HTMLInputElement).name
        }))
    );

  console.log(
    "\nDriver login inputs:"
  );

  console.table(inputs);

  // --------------------------------------------------
  // FIND CREDENTIAL FIELDS
  // --------------------------------------------------

  const visibleInputs =
    page.locator(
      'input:not([type="date"])'
    );

  console.log(
    "\nCredential input count:",
    await visibleInputs.count()
  );

  if (await visibleInputs.count() < 2) {
    throw new Error(
      "Driver login form did not expose the expected credential fields."
    );
  }

  // Use the first non-date text-like input as username/email.
  const usernameInput =
    visibleInputs.first();

  const passwordInput =
    page.locator(
      'input[type="password"]'
    ).first();

  if (await passwordInput.count() === 0) {
    throw new Error(
      "Driver password field was not found."
    );
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  await usernameInput.fill(
    "driver@transcargalaxy.com"
  );

  await passwordInput.fill(
    "JaredT"
  );

  console.log(
    "✓ Driver credentials entered"
  );

  const signInButton =
    page.getByRole("button", {
      name: /sign in|login/i
    }).last();

  console.log(
    "Sign-in buttons found:",
    await page.getByRole("button", {
      name: /sign in|login/i
    }).count()
  );

  await signInButton.click();

  await page.waitForTimeout(10000);

  console.log(
    "\n✓ Driver authentication attempt completed"
  );

  console.log(
    "Current URL:",
    page.url()
  );

  // --------------------------------------------------
  // PAGE CONTENT
  // --------------------------------------------------

  const bodyText =
    await page.locator("body").innerText();

  console.log(
    "\n========== FINANCIAL ACCESS CHECK =========="
  );

  const financialTerms = [
    "Revenue",
    "Expenses",
    "Expense",
    "Payments",
    "Payroll",
    "Financial Controls & Payroll",
    "Record Operating Expense",
    "Save & Post to Ledger",
    "Operating Expenses Ledger"
  ];

  for (const term of financialTerms) {
    const found =
      bodyText
        .toLowerCase()
        .includes(term.toLowerCase());

    console.log(
      `${found ? "❌" : "✓"} ${term}: ${
        found
          ? "VISIBLE"
          : "NOT VISIBLE"
      }`
    );
  }

  // --------------------------------------------------
  // MANAGER NAVIGATION CHECK
  // --------------------------------------------------

  console.log(
    "\n========== MANAGER NAVIGATION CHECK =========="
  );

  const managerItems = [
    "Executive Overview",
    "Routes & Price Management",
    "Trip Schedules",
    "Financial Controls & Payroll",
    "Fleet Management",
    "Driver Roster",
    "Bookings & Refunds",
    "Safety & Inspections",
    "Security Audit Trail"
  ];

  for (const item of managerItems) {
    const count =
      await page.getByRole("button", {
        name: item,
        exact: true
      }).count();

    console.log(
      `${count > 0 ? "❌" : "✓"} ${item}: ${
        count > 0
          ? "AVAILABLE"
          : "NOT AVAILABLE"
      }`
    );
  }

  // --------------------------------------------------
  // DIRECT MANAGER ROUTE CHECK
  // --------------------------------------------------

  console.log(
    "\n========== DIRECT MANAGER ACCESS CHECK =========="
  );

  await page.goto(
    "http://localhost:3000/manager/login",
    {
      waitUntil: "networkidle"
    }
  );

  await page.waitForTimeout(3000);

  console.log(
    "After opening manager route:",
    page.url()
  );

  const managerPageText =
    await page.locator("body").innerText();

  const managerFinancialVisible =
    managerPageText
      .toLowerCase()
      .includes(
        "financial controls & payroll"
      );

  console.log(
    "Manager financial controls visible:",
    managerFinancialVisible
  );

  const managerPortalVisible =
    managerPageText
      .toLowerCase()
      .includes(
        "operations dashboard"
      );

  console.log(
    "Manager dashboard visible:",
    managerPortalVisible
  );

  // --------------------------------------------------
  // SCREENSHOT
  // --------------------------------------------------

  await page.screenshot({
    path:
      "test-results/driver-financial-security.png",
    fullPage: true
  });

  // --------------------------------------------------
  // ERRORS
  // --------------------------------------------------

  console.log(
    "\n========== CONSOLE ERRORS =========="
  );

  if (errors.length === 0) {
    console.log(
      "✓ No console errors"
    );
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
    "test-results/driver-financial-security.png"
  );

  console.log(
    "\n========================================"
  );

  console.log(
    "DRIVER FINANCIAL SECURITY TEST COMPLETE"
  );

  console.log(
    "========================================"
  );

  await browser.close();
})();