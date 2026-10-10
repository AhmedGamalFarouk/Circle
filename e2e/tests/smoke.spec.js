import { test, expect, login, knownBug } from "../support/fixtures.js";
import { createUser, createCircle } from "../support/emulator.js";

const PUBLIC_PAGES = [
  { path: "/", title: /Landing Page|Circle/ },
  { path: "/about", text: "About Circle" },
  { path: "/payments", text: "Choose Your Circle" },
  { path: "/login", text: "Let's sign you in" },
  { path: "/register", text: "Create your account to get started" },
  { path: "/forget-password", text: /password/i },
  { path: "/explore", text: "Get My Position" },
];

test.describe("public pages load cleanly", () => {
  for (const { path, text, title } of PUBLIC_PAGES) {
    test(`${path} renders without uncaught errors`, async ({ page, problems }) => {
      await page.goto(path);
      if (text) await expect(page.getByText(text).first()).toBeVisible();
      if (title) await expect(page).toHaveTitle(title);
      expect(problems.filter((p) => p.startsWith("pageerror"))).toEqual([]);
    });
  }

  test("unknown routes show the 404 page with a way home", async ({ page }) => {
    await page.goto("/definitely/not/a/page");
    await expect(page.getByText("Oops!")).toBeVisible();
    await page.getByText("BACK TO HOME").click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("navigation", () => {
  test("header links reach every main section", async ({ page }) => {
    const me = await createUser();
    await login(page, me);
    for (const [label, url] of [
      ["Explore", /\/explore$/],
      ["Circles", /\/circles$/],
      ["Events", /\/events$/],
      ["Payments", /\/payments$/],
      ["About Us", /\/about$/],
      ["Home", /\/$/],
    ]) {
      await page.getByRole("link", { name: label, exact: true }).first().click();
      await expect(page).toHaveURL(url);
    }
  });

  test("logout returns to a signed-out state", async ({ page }) => {
    const me = await createUser();
    await login(page, me);
    await page.getByRole("button", { name: "User menu" }).click();
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/");
    await expect(page.getByText("SignIn/Up")).toBeVisible();
  });

  test("events page lists the user's upcoming confirmed events", async ({ page }) => {
    knownBug("BUG-15", "the calendar is built from the localStorage cache of the previous visit; freshly loaded events never reach it");
    const me = await createUser();
    const circle = await createCircle(me);
    const { adminDb, Timestamp } = await import("../support/emulator.js");
    const day = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await adminDb.collection(`circles/${circle.id}/events`).add({
      title: "Bowling night", activity: "Bowling night", location: "Downtown", place: "Downtown",
      status: "confirmed", day, createdBy: me.uid, createdAt: Timestamp.now(), rsvps: {},
    });
    await login(page, me);
    await page.goto("/events");
    await expect(page.getByText("Bowling night").first()).toBeVisible();
  });
});

test.describe("signed-out access", () => {
  test("member-only pages send visitors to login", async ({ page }) => {
    knownBug("BUG-06", "ProtectedRoute exists but is commented out; signed-out visitors get blank or skeleton pages instead of a login prompt");
    const owner = await createUser();
    const circle = await createCircle(owner);
    for (const path of [`/circles/${circle.id}`, "/circles-requests", `/circles/${circle.id}/memories`]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
