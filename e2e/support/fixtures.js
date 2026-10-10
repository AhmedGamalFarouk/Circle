import { test as base, expect } from "@playwright/test";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

// Every test gets a page that:
// - never reaches the internet (images, fonts, map tiles, Cloudinary are
//   stubbed), so runs are fast and can't touch real services;
// - records uncaught exceptions and Firestore permission errors, which the
//   audit treats as bugs.
export const test = base.extend({
  problems: async ({}, use) => {
    await use([]);
  },
  page: async ({ page, problems }, use, testInfo) => {
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && /permission-denied|Missing or insufficient permissions/i.test(text)) {
        problems.push(`permission: ${text.slice(0, 300)}`);
      }
    });
    await page.route(
      (url) => !LOCAL_HOSTS.has(url.hostname),
      (route) => {
        const type = route.request().resourceType();
        if (type === "image") {
          // 1x1 transparent GIF
          return route.fulfill({
            contentType: "image/gif",
            body: Buffer.from("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64"),
          });
        }
        if (type === "stylesheet" || type === "font") {
          return route.fulfill({ status: 200, body: "" });
        }
        return route.abort();
      },
    );
    await use(page);
    if (problems.length) {
      await testInfo.attach("browser-problems", {
        body: problems.join("\n"),
        contentType: "text/plain",
      });
    }
  },
});

export { expect };

export async function login(page, user) {
  await page.goto("/login");
  await page.getByPlaceholder("Email address").fill(user.email);
  await page.getByPlaceholder("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// Marks a test that reproduces a bug found by the audit (see e2e/README.md).
// The test is expected to fail; once the bug is fixed Playwright reports it
// as "unexpectedly passed", which is the cue to delete this line.
// Run with E2E_STRICT=1 to see these tests fail with their real errors.
export function knownBug(id, summary) {
  test.info().annotations.push({ type: "known-bug", description: `${id}: ${summary}` });
  if (!process.env.E2E_STRICT) test.fail(true, `${id}: ${summary}`);
}
