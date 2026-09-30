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
  console.log("MANAGER LOGOUT SECURITY TEST");
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

  console.log("\n✓ Manager login completed");

  // --------------------------------------------------
  // VERIFY MANAGER DASHBOARD
  // --------------------------------------------------

  const dashboardText =
    await page
      .locator("body")
      .innerText();

  const dashboardVisible =
    dashboardText
      .toLowerCase()
      .includes("operations dashboard");

  console.log(
    "Manager dashboard visible:",
    dashboardVisible
  );

  const signOutButton =
    page.getByRole("button", {
      name: "Sign Out",
      exact: true
    });

  console.log(
    "Sign Out button count:",
    await signOutButton.count()
  );

  console.log(
    "Sign Out visible:",
    await signOutButton.isVisible()
  );

  // --------------------------------------------------
  // CAPTURE SESSION STORAGE BEFORE LOGOUT
  // --------------------------------------------------

  const storageBefore =
    await page.evaluate(() => ({
      localStorage: Object.keys(
        localStorage
      ),
      sessionStorage: Object.keys(
        sessionStorage
      )
    }));

  console.log(
    "\n========== STORAGE BEFORE LOGOUT =========="
  );

  console.log(
    JSON.stringify(
      storageBefore,
      null,
      2
    )
  );

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  console.log(
    "\nClicking Sign Out..."
  );

  await signOutButton.click();

  await page.waitForTimeout(2000);

  console.log(
    "✓ Sign Out clicked"
  );

  console.log(
    "URL after logout:",
    page.url()
  );

  // --------------------------------------------------
  // CHECK PAGE AFTER LOGOUT
  // --------------------------------------------------

  const afterLogoutText =
    await page
      .locator("body")
      .innerText();

  const dashboardAfterLogout =
    afterLogoutText
      .toLowerCase()
      .includes(
        "operations dashboard"
      );

  const managerFinancialAfterLogout =
    afterLogoutText
      .toLowerCase()
      .includes(
        "financial controls & payroll"
      );

  console.log(
    "\n========== AFTER LOGOUT =========="
  );

  console.log(
    "Manager dashboard still visible:",
    dashboardAfterLogout
  );

  console.log(
    "Financial controls still visible:",
    managerFinancialAfterLogout
  );

  // --------------------------------------------------
  // STORAGE AFTER LOGOUT
  // --------------------------------------------------

  const storageAfter =
    await page.evaluate(() => ({
      localStorage: Object.keys(
        localStorage
      ),
      sessionStorage: Object.keys(
        sessionStorage
      )
    }));

  console.log(
    "\n========== STORAGE AFTER LOGOUT =========="
  );

  console.log(
    JSON.stringify(
      storageAfter,
      null,
      2
    )
  );

  // --------------------------------------------------
  // DIRECT MANAGER ROUTE AFTER LOGOUT
  // --------------------------------------------------

  console.log(
    "\n========== DIRECT ACCESS AFTER LOGOUT =========="
  );

  await page.goto(
    "http://localhost:3000/manager/login",
    {
      waitUntil: "networkidle"
    }
  );

  await page.waitForTimeout(3000);

  console.log(
    "Manager route after logout:",
    page.url()
  );

  const directAccessText =
    await page
      .locator("body")
      .innerText();

  const dashboardDirectAccess =
    directAccessText
      .toLowerCase()
      .includes(
        "operations dashboard"
      );

  const financialDirectAccess =
    directAccessText
      .toLowerCase()
      .includes(
        "financial controls & payroll"
      );

  const signInVisible =
    await page.getByRole("button", {
      name: "Sign In",
      exact: true
    }).count();

  console.log(
    "Manager dashboard directly accessible:",
    dashboardDirectAccess
  );

  console.log(
    "Financial controls directly accessible:",
    financialDirectAccess
  );

  console.log(
    "Sign In button available:",
    signInVisible > 0
  );

  // --------------------------------------------------
  // SCREENSHOT
  // --------------------------------------------------

  await page.screenshot({
    path:
      "test-results/manager-logout-security.png",
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
    "test-results/manager-logout-security.png"
  );

  console.log(
    "\n========================================"
  );

  console.log(
    "MANAGER LOGOUT SECURITY TEST COMPLETE"
  );

  console.log(
    "========================================"
  );

  await browser.close();
})();