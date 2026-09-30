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
  console.log("TRANSCAR GALAXY - MANAGER AUTH FLOW");
  console.log("========================================");

  // --------------------------------------------------
  // 1. OPEN MANAGER LOGIN
  // --------------------------------------------------

  console.log("\n1. Opening Manager Login...");

  await page.goto("http://localhost:3000/manager/login", {
    waitUntil: "networkidle"
  });

  console.log("URL:", page.url());

// --------------------------------------------------
// 2. OPEN THE MANAGER LOGIN FORM
// --------------------------------------------------

console.log("\n2. Opening Manager Login form...");

const managerButton = page.getByRole("button", {
  name: "Manager Login",
  exact: true
});

console.log(
  "Manager Login button count:",
  await managerButton.count()
);

if (await managerButton.count() === 0) {
  console.log("❌ Manager Login button not found.");
  await browser.close();
  return;
}

console.log(
  "Manager Login visible:",
  await managerButton.isVisible()
);

console.log(
  "Manager Login enabled:",
  await managerButton.isEnabled()
);

await managerButton.click();

await page.waitForTimeout(1000);

console.log(
  "URL after opening login:",
  page.url()
);

// --------------------------------------------------
// 3. FIND LOGIN FORM
// --------------------------------------------------

const username = page.locator(
  'input[placeholder="admintranscar"]'
);

const password = page.locator(
  'input[type="password"]'
);

const signIn = page.getByRole("button", {
  name: "Sign In",
  exact: true
});

console.log("\n3. Login form:");

console.log(
  "Username visible:",
  await username.isVisible()
);

console.log(
  "Password visible:",
  await password.isVisible()
);

console.log(
  "Sign In visible:",
  await signIn.isVisible()
);
  // --------------------------------------------------
  // 3. ENTER CREDENTIALS
  // --------------------------------------------------

console.log("\n4. Entering manager credentials...");

  await username.fill("manager@transcargalaxy.com");

  await password.fill(process.env.INITIAL_MANAGER_PASSWORD || "");

  console.log("Credentials entered.");

  // --------------------------------------------------
  // 4. SIGN IN
  // --------------------------------------------------

  console.log("\n5. Clicking Sign In...");

  await signIn.click();

 await page.waitForTimeout(10000);
 console.log("\n10 seconds after Sign In...");
console.log("URL:", page.url());

const currentBodyText = await page.locator("body").innerText();

console.log(
  "Manager suite still loading:",
  currentBodyText.includes("Loading Manager Executive Suite...")
);

console.log(
  "Dashboard text present:",
  currentBodyText.toLowerCase().includes("dashboard")
);
  console.log("\nAFTER SIGN IN");
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());

  // --------------------------------------------------
  // 5. INSPECT PAGE
  // --------------------------------------------------

  console.log("\n========== VISIBLE BUTTONS ==========");

  const buttons = await page.locator("button").evaluateAll(
    (elements) =>
      elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();

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
            ).trim() || "[NO TEXT]"
        }))
  );

  console.table(buttons);

  console.log("\n========== HEADINGS ==========");

  const headings = await page
    .locator("h1,h2,h3")
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
        .map((el) =>
          (el.textContent || "").trim()
        )
        .filter(Boolean)
    );

  console.table(headings);

  // --------------------------------------------------
  // 6. CHECK FINANCIAL AREAS
  // --------------------------------------------------

  console.log("\n========== FINANCIAL ACCESS ==========");

  const bodyText =
    await page.locator("body").innerText();

  console.log(
    "Revenue visible:",
    bodyText.toLowerCase().includes("revenue")
  );

  console.log(
    "Expenses visible:",
    bodyText.toLowerCase().includes("expenses")
  );

  console.log(
    "Payments visible:",
    bodyText.toLowerCase().includes("payments")
  );

  // --------------------------------------------------
  // 7. ERRORS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 8. SCREENSHOT
  // --------------------------------------------------

  await page.screenshot({
    path:
      "test-results/manager-after-login.png",
    fullPage: true
  });

  console.log(
    "\nScreenshot saved:"
  );

  console.log(
    "test-results/manager-after-login.png"
  );

  console.log("\n========================================");
  console.log("MANAGER AUTH TEST COMPLETE");
  console.log("========================================");

  await browser.close();
})();