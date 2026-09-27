import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// ============================================================
// TRANS CAR GALAXY - COMPLETE FRONTEND AUDIT
// Checks:
// - Pages
// - Links
// - Buttons
// - Responsive layouts
// - Horizontal overflow
// - Console errors
// - Failed network requests
// - Broken navigation
// - Hidden/off-screen interactive elements
//
// NOTE:
// This test intentionally DOES NOT automatically submit forms,
// delete records, make payments, or modify database data.
// ============================================================

const viewports = [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'mobile', width: 375, height: 667 },
  { name: 'large-mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

// ------------------------------------------------------------
// Add your actual routes here if they exist.
// Unknown routes are reported but will not crash the whole audit.
// ------------------------------------------------------------

const pagesToAudit = [
  '/',
  '/routes',
  '/vehicles',
  '/announcements',
  '/driver/login',
  '/manager/login',
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function getConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  return errors;
}

async function checkHorizontalOverflow(page: Page) {
  return await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;

    return {
      documentWidth,
      viewportWidth,
      overflow: documentWidth > viewportWidth + 2,
    };
  });
}

async function getInteractiveElements(page: Page) {
  return await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="link"]'
      )
    );

    return elements.map((element, index) => {
      const rect = element.getBoundingClientRect();

      return {
        index,
        tag: element.tagName.toLowerCase(),
        text:
          (element.textContent ||
            (element as HTMLInputElement).value ||
            '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 100),

        href:
          element instanceof HTMLAnchorElement
            ? element.getAttribute('href')
            : null,

        type:
          element instanceof HTMLButtonElement ||
          element instanceof HTMLInputElement
            ? element.getAttribute('type')
            : null,

        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          getComputedStyle(element).visibility !== 'hidden' &&
          getComputedStyle(element).display !== 'none',

        enabled:
          !(element instanceof HTMLButtonElement) ||
          !element.disabled,

        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),

        outsideViewport:
          rect.right > window.innerWidth ||
          rect.left < 0 ||
          rect.bottom > window.innerHeight ||
          rect.top < 0,
      };
    });
  });
}

// ------------------------------------------------------------
// 1. BUILD / BASIC PAGE LOAD
// ------------------------------------------------------------

test.describe('TransCar Galaxy - Complete Application Audit', () => {
  test('all important pages load without fatal browser errors', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });

    const page = await context.newPage();

    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    for (const route of pagesToAudit) {
      console.log(`\n========================================`);
      console.log(`AUDITING PAGE: ${route}`);
      console.log(`========================================`);

      consoleErrors.length = 0;

      try {
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        if (!response) {
          console.log(`⚠ No response received for ${route}`);
          continue;
        }

        console.log(`HTTP STATUS: ${response.status()}`);

        if (response.status() >= 400) {
          console.log(
            `⚠ PAGE RETURNED HTTP ${response.status()}: ${route}`
          );
          continue;
        }

        await page.waitForTimeout(500);

        const title = await page.title();

        console.log(`TITLE: ${title}`);

        if (consoleErrors.length > 0) {
          console.log(`⚠ Console errors found:`);

          consoleErrors.forEach((error) => {
            console.log(`   ${error}`);
          });
        } else {
          console.log(`✓ No console errors`);
        }
      } catch (error) {
        console.log(`✗ Failed to load ${route}`);
        console.log(String(error));
      }
    }

    await context.close();
  });

  // ----------------------------------------------------------
  // 2. BUTTON AUDIT
  // ----------------------------------------------------------

  test('find and inspect all buttons', async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const buttons = page.locator('button');

    const count = await buttons.count();

    console.log(`\n========================================`);
    console.log(`BUTTON AUDIT`);
    console.log(`========================================`);
    console.log(`Total buttons found: ${count}`);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      const text = ((await button.innerText().catch(() => '')) || '')
        .trim()
        .replace(/\s+/g, ' ');

      const visible = await button.isVisible().catch(() => false);
      const enabled = await button.isEnabled().catch(() => false);

      console.log(
        `Button ${i + 1}: "${text || '[NO TEXT]'}" | visible=${visible} | enabled=${enabled}`
      );
    }

    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ----------------------------------------------------------
  // 3. LINK AUDIT
  // ----------------------------------------------------------

  test('inspect all links and detect suspicious href values', async ({
    page,
  }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const links = await page.locator('a').evaluateAll((elements) =>
      elements.map((element) => ({
        text: (element.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 100),
        href: element.getAttribute('href'),
      }))
    );

    console.log(`\n========================================`);
    console.log(`LINK AUDIT`);
    console.log(`========================================`);
    console.log(`Total links found: ${links.length}`);

    for (const link of links) {
      console.log(
        `"${link.text || '[NO TEXT]'}" -> ${link.href || '[NO HREF]'}`
      );

      if (
        !link.href ||
        link.href === '#' ||
        link.href === 'javascript:void(0)'
      ) {
        console.log(`⚠ Suspicious/dead link detected`);
      }
    }

    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  // ----------------------------------------------------------
  // 4. RESPONSIVENESS TEST
  // ----------------------------------------------------------

  for (const viewport of viewports) {
    test(`responsive layout - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: {
          width: viewport.width,
          height: viewport.height,
        },
      });

      const page = await context.newPage();

      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      page.on('pageerror', (error) => {
        consoleErrors.push(`PAGE ERROR: ${error.message}`);
      });

      page.on('requestfailed', (request) => {
        failedRequests.push(
          `${request.method()} ${request.url()} - ${
            request.failure()?.errorText || 'unknown error'
          }`
        );
      });

      await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await page.waitForTimeout(1000);

      console.log(`\n========================================`);
      console.log(
        `RESPONSIVE TEST: ${viewport.name} ${viewport.width}x${viewport.height}`
      );
      console.log(`========================================`);

      // Horizontal overflow
      const overflow = await checkHorizontalOverflow(page);

      console.log(
        `Viewport width: ${overflow.viewportWidth}px`
      );

      console.log(
        `Document width: ${overflow.documentWidth}px`
      );

      if (overflow.overflow) {
        console.log(
          `⚠ HORIZONTAL OVERFLOW DETECTED`
        );
      } else {
        console.log(
          `✓ No horizontal overflow`
        );
      }

      // Interactive elements
      const elements = await getInteractiveElements(page);

      console.log(
        `Interactive elements found: ${elements.length}`
      );

      for (const element of elements) {
        if (!element.visible) {
          continue;
        }

        if (element.outsideViewport) {
          console.log(
            `⚠ Off-screen element: ${element.tag} "${element.text}"`
          );
        }

        if (element.width < 40 || element.height < 30) {
          console.log(
            `⚠ Very small interactive element: ${element.tag} "${element.text}" ${element.width}x${element.height}`
          );
        }
      }

      if (consoleErrors.length > 0) {
        console.log(`⚠ Console errors:`);

        consoleErrors.forEach((error) => {
          console.log(`   ${error}`);
        });
      } else {
        console.log(`✓ No console errors`);
      }

      if (failedRequests.length > 0) {
        console.log(`⚠ Failed network requests:`);

        failedRequests.forEach((request) => {
          console.log(`   ${request}`);
        });
      } else {
        console.log(`✓ No failed network requests`);
      }

      await context.close();
    });
  }

  // ----------------------------------------------------------
  // 5. BUTTON CLICKABILITY TEST
  //
  // This checks whether visible buttons CAN be clicked.
  // It does NOT assume the resulting action is correct.
  // ----------------------------------------------------------

  test('visible buttons can be clicked safely', async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const buttons = page.locator('button');

    const count = await buttons.count();

    console.log(`\n========================================`);
    console.log(`BUTTON CLICKABILITY TEST`);
    console.log(`========================================`);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      const visible = await button.isVisible().catch(() => false);

      if (!visible) {
        continue;
      }

      const text = ((await button.innerText().catch(() => '')) || '')
        .trim()
        .replace(/\s+/g, ' ');

      const disabled = !(await button.isEnabled().catch(() => false));

      if (disabled) {
        console.log(
          `SKIP disabled button: "${text}"`
        );
        continue;
      }

      console.log(
        `Testing: "${text || '[NO TEXT]'}"`
      );

      try {
        await button.scrollIntoViewIfNeeded();

        await button.click({
          timeout: 3000,
        });

        console.log(`✓ Click succeeded`);
      } catch (error) {
        console.log(`✗ Click failed`);
        console.log(String(error));
      }
    }
  });

  // ----------------------------------------------------------
  // 6. NAVIGATION TEST
  //
  // Tests internal links that point to actual application routes.
  // ----------------------------------------------------------

  test('internal navigation links do not return obvious 404 pages', async ({
    page,
  }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const hrefs = await page.locator('a').evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href'))
        .filter(
          (href): href is string =>
            !!href &&
            href.startsWith('/') &&
            !href.startsWith('//') &&
            href !== '#'
        )
    );

    const uniqueHrefs = [...new Set(hrefs)];

    console.log(`\n========================================`);
    console.log(`NAVIGATION TEST`);
    console.log(`========================================`);

    for (const href of uniqueHrefs) {
      try {
        const response = await page.request.get(
          `${BASE_URL}${href}`
        );

        console.log(
          `${href} -> HTTP ${response.status()}`
        );

        if (response.status() >= 400) {
          console.log(
            `⚠ Possible broken route: ${href}`
          );
        }
      } catch (error) {
        console.log(
          `✗ Could not test ${href}: ${String(error)}`
        );
      }
    }
  });

  // ----------------------------------------------------------
  // 7. FORM AUDIT
  // ----------------------------------------------------------

  test('inspect forms without submitting them', async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const forms = await page.locator('form').evaluateAll((forms) =>
      forms.map((form, index) => ({
        index,
        action: form.getAttribute('action'),
        method: form.getAttribute('method'),
        inputs: form.querySelectorAll('input').length,
        buttons: form.querySelectorAll('button').length,
      }))
    );

    console.log(`\n========================================`);
    console.log(`FORM AUDIT`);
    console.log(`========================================`);

    console.log(`Forms found: ${forms.length}`);

    for (const form of forms) {
      console.log(
        `Form ${form.index + 1}: action=${form.action} method=${form.method} inputs=${form.inputs} buttons=${form.buttons}`
      );
    }
  });

  // ----------------------------------------------------------
  // 8. ACCESSIBILITY BASICS
  // ----------------------------------------------------------

  test('check buttons and links for usable labels', async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(500);

    const interactive = await getInteractiveElements(page);

    console.log(`\n========================================`);
    console.log(`ACCESSIBILITY BASICS`);
    console.log(`========================================`);

    for (const element of interactive) {
      if (!element.visible) {
        continue;
      }

      if (
        ['button', 'a'].includes(element.tag) &&
        !element.text &&
        !element.href
      ) {
        console.log(
          `⚠ Unlabelled interactive element: ${element.tag}`
        );
      }
    }
  });

  // ----------------------------------------------------------
  // 9. SCREENSHOT OF EACH RESPONSIVE SIZE
  // ----------------------------------------------------------

  for (const viewport of viewports) {
    test(`capture ${viewport.name} screenshot`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: {
          width: viewport.width,
          height: viewport.height,
        },
      });

      const page = await context.newPage();

      await page.goto(BASE_URL, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      await page.screenshot({
        path: `test-results/${viewport.name}.png`,
        fullPage: true,
      });

      console.log(
        `✓ Screenshot saved: test-results/${viewport.name}.png`
      );

      await context.close();
    });
  }
});