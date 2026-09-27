import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 }
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
  console.log("MANAGER LOGIN NAVIGATION TEST");
  console.log("========================================");

  await page.goto("http://localhost:3000/manager/login", {
    waitUntil: "networkidle"
  });

  console.log("\nBEFORE CLICK");
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());

  const managerButton = page.getByRole("button", {
    name: "Manager Login",
    exact: true
  });

  const count = await managerButton.count();

  console.log("Manager Login button count:", count);

  if (count === 0) {
    console.log("❌ Manager Login button was not found.");
    await browser.close();
    return;
  }

  console.log("Button visible:", await managerButton.isVisible());
  console.log("Button enabled:", await managerButton.isEnabled());

  console.log("\nCLICKING MANAGER LOGIN...");

  await managerButton.click();

  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);

  console.log("\nAFTER CLICK");
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());

  console.log("\n========== INPUTS ==========");

  const inputs = await page.locator("input").evaluateAll((elements) =>
    elements.map((el, index) => {
      const input = el as HTMLInputElement;

      return {
        "#": index + 1,
        type: input.type,
        name: input.name,
        placeholder: input.placeholder
      };
    })
  );

  console.table(inputs);

  console.log("\n========== BUTTONS ==========");

  const buttons = await page.locator("button").evaluateAll((elements) =>
    elements.map((el, index) => {
      const button = el as HTMLButtonElement;

      return {
        "#": index + 1,
        text:
          (button.innerText || button.textContent || "").trim() ||
          "[NO TEXT]",
        type: button.type,
        disabled: button.disabled,
        visible:
          button.offsetWidth > 0 &&
          button.offsetHeight > 0
      };
    })
  );

  console.table(buttons);

  console.log("\n========== LINKS ==========");

  const links = await page.locator("a").evaluateAll((elements) =>
    elements.map((el, index) => {
      const link = el as HTMLAnchorElement;

      return {
        "#": index + 1,
        text:
          (link.innerText || link.textContent || "").trim() ||
          "[NO TEXT]",
        href: link.href
      };
    })
  );

  console.table(links);

  console.log("\n========== CONSOLE ERRORS ==========");

  if (errors.length === 0) {
    console.log("✓ No console errors");
  } else {
    console.table(errors);
  }

  console.log("\n========== FAILED REQUESTS ==========");

  if (failedRequests.length === 0) {
    console.log("✓ No failed network requests");
  } else {
    console.table(failedRequests);
  }

  await page.screenshot({
    path: "test-results/manager-login-navigation.png",
    fullPage: true
  });

  console.log("\nScreenshot saved:");
  console.log("test-results/manager-login-navigation.png");

  console.log("\n========================================");
  console.log("TEST COMPLETE");
  console.log("========================================");

  await browser.close();
})();