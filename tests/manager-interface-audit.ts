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
  console.log("MANAGER INTERFACE AUDIT");
  console.log("========================================");

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  console.log("\n1. Opening manager login...");

  await page.goto(
    "http://localhost:3000/manager/login",
    {
      waitUntil: "networkidle"
    }
  );

  const managerLogin = page.getByRole("button", {
    name: "Manager Login",
    exact: true
  });

  await managerLogin.click();

  await page.waitForTimeout(500);

  const username = page.locator(
    'input[placeholder="admintranscar"]'
  );

  const password = page.locator(
    'input[type="password"]'
  );

  await username.fill(
    "manager@transcargalaxy.com"
  );

  await password.fill(
    "JaredT"
  );

  const signIn = page.getByRole("button", {
    name: "Sign In",
    exact: true
  });

  await signIn.click();

  // Give the application enough time to load
  await page.waitForTimeout(10000);

  console.log(
    "Manager dashboard loaded:",
    (await page.locator("body").innerText())
      .includes("Operations Dashboard")
  );

  // --------------------------------------------------
  // MANAGER BUTTON INVENTORY
  // --------------------------------------------------

  console.log("\n2. MANAGER BUTTON INVENTORY");

  const managerButtons =
    await page.locator("button").evaluateAll(
      (elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0
            );
          })
          .map((el, index) => {
            const button =
              el as HTMLButtonElement;

            const rect =
              button.getBoundingClientRect();

            return {
              "#": index + 1,
              text:
                (
                  button.innerText ||
                  button.textContent ||
                  ""
                ).trim() || "[NO TEXT]",
              type: button.type,
              disabled: button.disabled,
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
    );

  console.table(managerButtons);

  // --------------------------------------------------
  // MANAGER NAVIGATION ITEMS
  // --------------------------------------------------

  console.log(
    "\n3. MANAGER NAVIGATION ITEMS"
  );

  const navigationNames = [
    "Executive Overview",
    "Routes & Price Management",
    "Trip Schedules",
    "Financial Controls & Payroll",
    "Fleet Management",
    "Driver Roster",
    "Bookings & Refunds",
    "Safety & Inspections",
    "Security Audit Trail",
    "Supabase PostgreSQL DB"
  ];

  for (const name of navigationNames) {
    const locator = page.getByRole("button", {
      name,
      exact: true
    });

    const count = await locator.count();

    if (count === 0) {
      console.log(`❌ ${name} - NOT FOUND`);
      continue;
    }

    console.log(
      `✓ ${name} - found (${count})`
    );

    console.log(
      `  visible: ${await locator.first().isVisible()}`
    );

    console.log(
      `  enabled: ${await locator.first().isEnabled()}`
    );
  }

  // --------------------------------------------------
  // IMPORTANT ACTION BUTTONS
  // --------------------------------------------------

  console.log(
    "\n4. IMPORTANT ACTION BUTTONS"
  );

  const actionNames = [
    "Export CSV",
    "Send Alert",
    "Schedule New Trip",
    "Sign Out"
  ];

  for (const name of actionNames) {
    const locator = page.getByRole("button", {
      name,
      exact: true
    });

    const count = await locator.count();

    if (count === 0) {
      console.log(`❌ ${name} - NOT FOUND`);
      continue;
    }

    console.log(
      `✓ ${name} - found`
    );

    console.log(
      `  visible: ${await locator.first().isVisible()}`
    );

    console.log(
      `  enabled: ${await locator.first().isEnabled()}`
    );
  }

  // --------------------------------------------------
  // PAGE CONTENT
  // --------------------------------------------------

  console.log(
    "\n5. MANAGER CONTENT CHECK"
  );

  const bodyText =
    await page.locator("body").innerText();

  const contentChecks = [
    "Operations Dashboard",
    "Today's Operating Highway Departures",
    "Broadcast Instant Fleet Alert to Drivers",
    "Revenue",
    "Executive Overview"
  ];

  for (const text of contentChecks) {
    console.log(
      `${bodyText.includes(text) ? "✓" : "❌"} ${text}`
    );
  }

  // --------------------------------------------------
  // ERRORS
  // --------------------------------------------------

  console.log(
    "\n6. CONSOLE ERRORS"
  );

  if (errors.length === 0) {
    console.log("✓ No console errors");
  } else {
    console.table(errors);
  }

  console.log(
    "\n7. FAILED NETWORK REQUESTS"
  );

  if (failedRequests.length === 0) {
    console.log(
      "✓ No failed network requests"
    );
  } else {
    console.table(failedRequests);
  }

  // --------------------------------------------------
  // SCREENSHOT
  // --------------------------------------------------

  await page.screenshot({
    path:
      "test-results/manager-interface-audit.png",
    fullPage: true
  });

  console.log(
    "\nScreenshot saved:"
  );

  console.log(
    "test-results/manager-interface-audit.png"
  );

  console.log("\n========================================");
  console.log("MANAGER INTERFACE AUDIT COMPLETE");
  console.log("========================================");

  await browser.close();
})();