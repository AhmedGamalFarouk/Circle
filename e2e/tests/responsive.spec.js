import { test, expect, login } from "../support/fixtures.js";
import { createUser, createCircle } from "../support/emulator.js";

// Runs in the "mobile" project (Pixel 7 viewport).

async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe("phone-sized screens", () => {
  for (const path of ["/", "/login", "/register", "/about", "/payments"]) {
    test(`${path} fits the screen width`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test("circle chat is usable on a phone", async ({ page }) => {
    const me = await createUser();
    const circle = await createCircle(me);
    await login(page, me);
    await page.goto(`/circles/${circle.id}`);
    const box = page.getByPlaceholder("Type a message...");
    await expect(box).toBeInViewport();
    await box.fill("From my phone");
    await box.press("Enter");
    await expect(page.getByText("From my phone")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
