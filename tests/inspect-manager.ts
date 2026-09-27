import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 }
  });

  const errors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("requestfailed", request => {
    failedRequests.push(
      `${request.method()} ${request.url()} -> ${
        request.failure()?.errorText || "unknown"
      }`
    );
  });

  console.log("\n========================================");
  console.log("TRANSCAR GALAXY - MANAGER LOGIN");
  console.log("========================================");

  await page.goto("http://localhost:3000/manager/login", {
    waitUntil: "networkidle"
  });

  console.log("\nURL:", page.url());
  console.log("TITLE:", await page.title());

  console.log("\n========== INPUTS ==========");

  const inputs = await page.locator("input").evaluateAll(elements =>
    elements.map((el: any, index) => ({
      "#": index + 1,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      ariaLabel: el.getAttribute("aria-label")
    }))
  );

  console.table(inputs);

  console.log("\n========== BUTTONS ==========");

  const buttons = await page.locator("button").evaluateAll(elements =>
    elements.map((el: any, index) => ({
      "#": index + 1,
      text: (el.innerText || el.textContent || "").trim() || "[NO TEXT]",
      type: el.type,
      disabled: el.disabled,
      visible:
        el.offsetWidth > 0 &&
        el.offsetHeight > 0
    }))
  );

  console.table(buttons);

  console.log("\n========== LINKS ==========");

  const links = await page.locator("a").evaluateAll(elements =>
    elements.map((el: any, index) => ({
      "#": index + 1,
      text: (el.innerText || el.textContent || "").trim() || "[NO TEXT]",
      href: el.href
    }))
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

  console.log("\n========================================");
  console.log("INSPECTION COMPLETE");
  console.log("========================================\n");

  await browser.close();
})();