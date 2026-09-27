import { chromium } from "playwright";

const viewports = [
  { name: "small-mobile", width: 320, height: 568 },
  { name: "mobile", width: 375, height: 667 },
  { name: "large-mobile", width: 390, height: 844 }
];

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  console.log("\n========================================");
  console.log("MANAGER MOBILE AUDIT");
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

    console.log("\n========================================");
    console.log(
      `VIEWPORT: ${viewport.name} (${viewport.width}x${viewport.height})`
    );
    console.log("========================================");

    await page.goto(
      "http://localhost:3000/manager/login",
      {
        waitUntil: "networkidle"
      }
    );

    await page.waitForTimeout(500);

    // --------------------------------------------------
    // INSPECT INITIAL BUTTONS
    // --------------------------------------------------

    const initialButtons =
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
            .map((el) => ({
              text:
                (
                  el.textContent || ""
                ).trim(),
              width:
                Math.round(
                  el.getBoundingClientRect().width
                ),
              height:
                Math.round(
                  el.getBoundingClientRect().height
                )
            }))
      );

    console.log(
      "\nINITIAL VISIBLE BUTTONS"
    );

    console.table(
      initialButtons.slice(0, 25)
    );

    // --------------------------------------------------
    // FIND MANAGER LOGIN
    // --------------------------------------------------

    let managerLogin =
      page.getByRole("button", {
        name: "Manager Login",
        exact: true
      });

    let managerLoginCount =
      await managerLogin.count();

    console.log(
      "\nManager Login buttons found:",
      managerLoginCount
    );

    // --------------------------------------------------
    // TRY VISIBLE MANAGER LOGIN
    // --------------------------------------------------

    if (managerLoginCount > 0) {
      const visible =
        await managerLogin.first().isVisible();

      console.log(
        "Manager Login visible:",
        visible
      );

      if (visible) {
        await managerLogin.first().click();

        await page.waitForTimeout(500);

        console.log(
          "✓ Manager Login clicked"
        );
      }
    }

    // --------------------------------------------------
    // IF NOT FOUND, LOOK FOR MENU BUTTON
    // --------------------------------------------------

    managerLoginCount =
      await page.getByRole("button", {
        name: "Manager Login",
        exact: true
      }).count();

    if (managerLoginCount === 0) {
      console.log(
        "\nManager Login not directly visible."
      );

      const menuCandidates =
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
              .map((el) => ({
                text:
                  (
                    el.textContent || ""
                  ).trim(),
                aria:
                  el.getAttribute(
                    "aria-label"
                  ),
                title:
                  el.getAttribute("title"),
                width:
                  Math.round(
                    el.getBoundingClientRect()
                      .width
                  ),
                height:
                  Math.round(
                    el.getBoundingClientRect()
                      .height
                  )
              }))
              .filter((item) =>
                !item.text ||
                /menu|navigation|open|more/i.test(
                  `${item.text} ${item.aria} ${item.title}`
                )
              )
        );

      console.log(
        "Possible mobile menu buttons:"
      );

      console.table(menuCandidates);

      // Try common accessible menu labels.
      const menuPatterns = [
        /menu/i,
        /navigation/i,
        /open menu/i,
        /more/i
      ];

      let menuOpened = false;

      for (const pattern of menuPatterns) {
        const candidate =
          page.getByRole("button", {
            name: pattern
          }).first();

        if (
          await candidate.count() > 0 &&
          await candidate.isVisible()
        ) {
          try {
            await candidate.click();

            await page.waitForTimeout(500);

            console.log(
              `✓ Possible menu opened using ${pattern}`
            );

            menuOpened = true;
            break;
          } catch {
            // Continue trying alternatives.
          }
        }
      }

      if (!menuOpened) {
        console.log(
          "⚠ Could not identify a mobile menu button automatically."
        );
      }
    }

    // --------------------------------------------------
    // TRY MANAGER LOGIN AGAIN
    // --------------------------------------------------

    managerLogin =
      page.getByRole("button", {
        name: "Manager Login",
        exact: true
      });

    managerLoginCount =
      await managerLogin.count();

    console.log(
      "\nManager Login count after menu attempt:",
      managerLoginCount
    );

    if (managerLoginCount > 0) {
      const visible =
        await managerLogin.first().isVisible();

      console.log(
        "Manager Login visible after menu:",
        visible
      );

      if (visible) {
        await managerLogin.first().click();

        await page.waitForTimeout(500);

        console.log(
          "✓ Manager Login opened"
        );
      }
    }

    // --------------------------------------------------
    // CHECK LOGIN FORM
    // --------------------------------------------------

    const username =
      page.locator(
        'input[placeholder="admintranscar"]'
      );

    const password =
      page.locator(
        'input[type="password"]'
      );

    const formReady =
      await username.count() > 0 &&
      await password.count() > 0;

    console.log(
      "\nManager login form available:",
      formReady
    );

    if (!formReady) {
      console.log(
        "⚠ Mobile login form could not be opened."
      );

      await page.screenshot({
        path:
          `test-results/manager-mobile-login-${viewport.name}.png`,
        fullPage: true
      });

      await page.close();
      continue;
    }

    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------

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
    // DIMENSIONS
    // --------------------------------------------------

    const dimensions =
      await page.evaluate(() => ({
        viewportWidth:
          window.innerWidth,

        viewportHeight:
          window.innerHeight,

        documentWidth:
          document.documentElement
            .scrollWidth,

        documentHeight:
          document.documentElement
            .scrollHeight,

        bodyWidth:
          document.body.scrollWidth,

        bodyHeight:
          document.body.scrollHeight
      }));

    console.log(
      "\nPAGE DIMENSIONS"
    );

    console.table(dimensions);

    console.log(
      "Horizontal overflow:",
      dimensions.documentWidth >
        dimensions.viewportWidth + 1
        ? "❌ YES"
        : "✓ NO"
    );

    // --------------------------------------------------
    // OFF-SCREEN ELEMENTS
    // --------------------------------------------------

    const offscreen =
      await page.locator(
        "button, a, input, select, textarea"
      ).evaluateAll((elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0 &&
              (
                rect.left < -1 ||
                rect.right >
                  window.innerWidth + 1
              )
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
                el.getBoundingClientRect()
                  .left
              ),
            right:
              Math.round(
                el.getBoundingClientRect()
                  .right
              ),
            width:
              Math.round(
                el.getBoundingClientRect()
                  .width
              ),
            height:
              Math.round(
                el.getBoundingClientRect()
                  .height
              )
          }))
      );

    console.log(
      "\nOFF-SCREEN INTERACTIVE ELEMENTS:",
      offscreen.length
    );

    if (offscreen.length > 0) {
      console.table(
        offscreen.slice(0, 30)
      );
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
      ).evaluateAll((elements) =>
        elements
          .filter((el) => {
            const rect =
              el.getBoundingClientRect();

            return (
              rect.width > 0 &&
              rect.height > 0 &&
              (
                rect.width < 44 ||
                rect.height < 44
              )
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
                el.getBoundingClientRect()
                  .width
              ),
            height:
              Math.round(
                el.getBoundingClientRect()
                  .height
              )
          }))
      );

    console.log(
      "\nSMALL TOUCH TARGETS:",
      smallTargets.length
    );

    if (smallTargets.length > 0) {
      console.table(
        smallTargets.slice(0, 30)
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

      console.log(
        `${visible ? "✓" : "❌"} ${item}: visible=${visible}`
      );
    }

    // --------------------------------------------------
    // SCREENSHOT
    // --------------------------------------------------

    await page.screenshot({
      path:
        `test-results/manager-mobile-${viewport.name}.png`,
      fullPage: true
    });

    console.log(
      "\nScreenshot:"
    );

    console.log(
      `test-results/manager-mobile-${viewport.name}.png`
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
    "MANAGER MOBILE AUDIT COMPLETE"
  );

  console.log(
    "========================================"
  );

  await browser.close();
})();