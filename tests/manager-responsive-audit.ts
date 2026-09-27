import { chromium } from "playwright";

const viewports = [
  { name: "small-mobile", width: 320, height: 568 },
  { name: "mobile", width: 375, height: 667 },
  { name: "large-mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 }
];

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  console.log("\n========================================");
  console.log("MANAGER RESPONSIVE AUDIT");
  console.log("========================================");

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: {
        width: viewport.width,
        height: viewport.height
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

    console.log(
      `\n========================================`
    );

    console.log(
      `VIEWPORT: ${viewport.name} (${viewport.width}x${viewport.height})`
    );

    console.log(
      `========================================`
    );

    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------

    await page.goto(
      "http://localhost:3000/manager/login",
      {
        waitUntil: "networkidle"
      }
    );

    const managerLogin =
      page.getByRole("button", {
        name: "Manager Login",
        exact: true
      });

    if (await managerLogin.count() > 0) {
      await managerLogin.click();
      await page.waitForTimeout(300);
    }

    const username =
      page.locator(
        'input[placeholder="admintranscar"]'
      );

    const password =
      page.locator(
        'input[type="password"]'
      );

    if (
      await username.count() === 0 ||
      await password.count() === 0
    ) {
      console.log(
        "❌ Manager login form not available"
      );

      await page.close();
      continue;
    }

    await username.fill(
      "manager@transcargalaxy.com"
    );

    await password.fill(
      "JaredT"
    );

    await page.getByRole("button", {
      name: "Sign In",
      exact: true
    }).click();

    await page.waitForTimeout(8000);

    console.log(
      "✓ Manager authenticated"
    );

    // --------------------------------------------------
    // BASIC PAGE DIMENSIONS
    // --------------------------------------------------

    const dimensions =
      await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth:
          document.documentElement.scrollWidth,
        documentHeight:
          document.documentElement.scrollHeight,
        bodyWidth:
          document.body.scrollWidth,
        bodyHeight:
          document.body.scrollHeight
      }));

    console.log(
      "\nPAGE DIMENSIONS"
    );

    console.table(dimensions);

    const horizontalOverflow =
      dimensions.documentWidth >
      dimensions.viewportWidth + 1;

    console.log(
      "Horizontal overflow:",
      horizontalOverflow
        ? "❌ YES"
        : "✓ NO"
    );

    // --------------------------------------------------
    // OFF-SCREEN ELEMENTS
    // --------------------------------------------------

    const offscreen =
      await page.locator(
        "button, a, input, select, textarea"
      ).evaluateAll((elements) => {
        return elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            if (
              rect.width === 0 ||
              rect.height === 0
            ) {
              return false;
            }

            return (
              rect.left < -1 ||
              rect.right >
                window.innerWidth + 1
            );
          })
          .map((el) => ({
            tag: el.tagName,
            text:
              (
                el.textContent || ""
              ).trim().slice(0, 80),
            left:
              Math.round(
                el.getBoundingClientRect().left
              ),
            right:
              Math.round(
                el.getBoundingClientRect().right
              ),
            width:
              Math.round(
                el.getBoundingClientRect().width
              )
          }));
      });

    console.log(
      "\nOFF-SCREEN INTERACTIVE ELEMENTS:",
      offscreen.length
    );

    if (offscreen.length > 0) {
      console.table(offscreen.slice(0, 20));
    } else {
      console.log(
        "✓ No off-screen interactive elements"
      );
    }

    // --------------------------------------------------
    // SMALL TOUCH TARGETS
    // --------------------------------------------------

    const smallTargets =
      await page.locator(
        "button, a"
      ).evaluateAll((elements) => {
        return elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            if (
              rect.width === 0 ||
              rect.height === 0
            ) {
              return false;
            }

            return (
              rect.width < 44 ||
              rect.height < 44
            );
          })
          .map((el) => ({
            tag: el.tagName,
            text:
              (
                el.textContent || ""
              ).trim().slice(0, 80),
            width:
              Math.round(
                el.getBoundingClientRect().width
              ),
            height:
              Math.round(
                el.getBoundingClientRect().height
              )
          }));
      });

    console.log(
      "\nSMALL TOUCH TARGETS:",
      smallTargets.length
    );

    if (smallTargets.length > 0) {
      console.table(
        smallTargets.slice(0, 20)
      );
    }

    // --------------------------------------------------
    // MANAGER NAVIGATION
    // --------------------------------------------------

    const navigationItems = [
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

    console.log(
      "\nMANAGER NAVIGATION"
    );

    for (const item of navigationItems) {
      const button =
        page.getByRole("button", {
          name: item,
          exact: true
        });

      const count =
        await button.count();

      if (count === 0) {
        console.log(
          `⚠ ${item}: NOT FOUND`
        );
        continue;
      }

      const visible =
        await button.first().isVisible();

      const enabled =
        await button.first().isEnabled();

      console.log(
        `${visible && enabled ? "✓" : "❌"} ${item} | visible=${visible} enabled=${enabled}`
      );
    }

    // --------------------------------------------------
    // SAFE NAVIGATION TEST
    // --------------------------------------------------

    const safeSections = [
      {
        name: "Executive Overview",
        expected: "Operations Dashboard"
      },
      {
        name: "Routes & Price Management",
        expected: "Routes"
      },
      {
        name: "Trip Schedules",
        expected: "Trip"
      },
      {
        name: "Financial Controls & Payroll",
        expected: "Financial"
      },
      {
        name: "Fleet Management",
        expected: "Fleet"
      },
      {
        name: "Driver Roster",
        expected: "Driver"
      },
      {
        name: "Bookings & Refunds",
        expected: "Booking"
      },
      {
        name: "Safety & Inspections",
        expected: "Safety"
      },
      {
        name: "Security Audit Trail",
        expected: "Audit"
      },
      {
        name: "Supabase PostgreSQL DB",
        expected: "Supabase"
      }
    ];

    console.log(
      "\nSAFE SECTION NAVIGATION"
    );

    for (const section of safeSections) {
      const button =
        page.getByRole("button", {
          name: section.name,
          exact: true
        });

      if (await button.count() === 0) {
        continue;
      }

      try {
        await button.first().click();

        await page.waitForTimeout(400);

        const text =
          await page
            .locator("body")
            .innerText();

        const found =
          text
            .toLowerCase()
            .includes(
              section.expected.toLowerCase()
            );

        console.log(
          `${found ? "✓" : "⚠"} ${section.name} -> expected "${section.expected}"`
        );
      } catch (error) {
        console.log(
          `❌ ${section.name}: click failed`
        );
      }
    }

    // --------------------------------------------------
    // SCREENSHOT
    // --------------------------------------------------

    await page.screenshot({
      path:
        `test-results/manager-responsive-${viewport.name}.png`,
      fullPage: true
    });

    console.log(
      "\nScreenshot:"
    );

    console.log(
      `test-results/manager-responsive-${viewport.name}.png`
    );

    // --------------------------------------------------
    // ERRORS
    // --------------------------------------------------

    console.log(
      "\nCONSOLE ERRORS"
    );

    if (errors.length === 0) {
      console.log(
        "✓ No console errors"
      );
    } else {
      console.table(errors);
    }

    console.log(
      "\nFAILED REQUESTS"
    );

    if (failedRequests.length === 0) {
      console.log(
        "✓ No failed network requests"
      );
    } else {
      console.table(failedRequests);
    }

    await page.close();
  }

  console.log(
    "\n========================================"
  );

  console.log(
    "MANAGER RESPONSIVE AUDIT COMPLETE"
  );

  console.log(
    "========================================"
  );

  await browser.close();
})();