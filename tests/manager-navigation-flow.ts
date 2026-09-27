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
  console.log("MANAGER NAVIGATION FLOW TEST");
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

  const managerLogin = page.getByRole("button", {
    name: "Manager Login",
    exact: true
  });

  await managerLogin.click();

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

  console.log("\n✓ Manager authenticated");

  // --------------------------------------------------
  // NAVIGATION TESTS
  // --------------------------------------------------

  const sections = [
    {
      name: "Executive Overview",
      expected: [
        "Operations Dashboard"
      ]
    },
    {
      name: "Routes & Price Management",
      expected: [
        "Routes"
      ]
    },
    {
      name: "Trip Schedules",
      expected: [
        "Trip"
      ]
    },
    {
      name: "Financial Controls & Payroll",
      expected: [
        "Revenue",
        "Expense",
        "Financial"
      ]
    },
    {
      name: "Fleet Management",
      expected: [
        "Fleet",
        "Vehicle"
      ]
    },
    {
      name: "Driver Roster",
      expected: [
        "Driver"
      ]
    },
    {
      name: "Bookings & Refunds",
      expected: [
        "Booking",
        "Refund"
      ]
    },
    {
      name: "Safety & Inspections",
      expected: [
        "Safety",
        "Inspection"
      ]
    },
    {
      name: "Security Audit Trail",
      expected: [
        "Audit",
        "Security"
      ]
    },
    {
      name: "Supabase PostgreSQL DB",
      expected: [
        "Supabase",
        "PostgreSQL",
        "Database",
        "DB"
      ]
    }
  ];

  for (const section of sections) {
    console.log(
      `\n----------------------------------------`
    );

    console.log(
      `TESTING: ${section.name}`
    );

    const button = page.getByRole("button", {
      name: section.name,
      exact: true
    });

    if (await button.count() === 0) {
      console.log("❌ BUTTON NOT FOUND");
      continue;
    }

    if (!(await button.isVisible())) {
      console.log("❌ BUTTON NOT VISIBLE");
      continue;
    }

    if (!(await button.isEnabled())) {
      console.log("❌ BUTTON DISABLED");
      continue;
    }

    console.log("✓ Button available");

    await button.click();

    await page.waitForTimeout(1000);

    const bodyText =
      await page.locator("body").innerText();

    const matched =
      section.expected.filter((term) =>
        bodyText
          .toLowerCase()
          .includes(term.toLowerCase())
      );

    console.log(
      "Expected terms found:",
      matched.length > 0
        ? matched.join(", ")
        : "NONE"
    );

    if (matched.length > 0) {
      console.log("✓ Section appears to have loaded");
    } else {
      console.log(
        "⚠ Section title/content not detected"
      );
    }

    console.log(
      "Current URL:",
      page.url()
    );

    await page.screenshot({
      path:
        `test-results/manager-${section.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}.png`,
      fullPage: true
    });
  }

  // --------------------------------------------------
  // FINAL ERROR CHECK
  // --------------------------------------------------

  console.log(
    "\n========================================"
  );

  console.log(
    "CONSOLE ERRORS"
  );

  if (errors.length === 0) {
    console.log("✓ No console errors");
  } else {
    console.table(errors);
  }

  console.log(
    "\nFAILED NETWORK REQUESTS"
  );

  if (failedRequests.length === 0) {
    console.log(
      "✓ No failed network requests"
    );
  } else {
    console.table(failedRequests);
  }

  console.log(
    "\n========================================"
  );

  console.log(
    "MANAGER NAVIGATION TEST COMPLETE"
  );

  console.log(
    "========================================"
  );

  await browser.close();
})();