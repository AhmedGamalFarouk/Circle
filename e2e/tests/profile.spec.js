import { test, expect, login, knownBug } from "../support/fixtures.js";
import { createUser, createMobileUser, getDoc, listDocs, clientFor } from "../support/emulator.js";

test.describe("profile", () => {
  test("shows the user's own profile with an editable bio", async ({ page }) => {
    const me = await createUser();
    await login(page, me);
    await page.goto(`/profile/${me.uid}`);
    await expect(page.getByText(`@${me.username}`)).toBeVisible();
    // The bio editor's buttons are icon-only with no accessible name.
    const bio = page.getByPlaceholder("Tell us about yourself...");
    if (!(await bio.isVisible())) {
      await page.getByText("Add a bio to tell people about yourself").locator("xpath=following-sibling::button[1]").click();
    }
    await bio.fill("I like hiking");
    await expect(page.getByText("13/160")).toBeVisible();
    await bio.locator("xpath=following::button[1]").click();
    await expect(page.getByText("I like hiking")).toBeVisible();
    await expect.poll(async () => (await getDoc(`users/${me.uid}`)).bio).toBe("I like hiking");
  });

  test("a profile created on mobile renders on the web", async ({ page, problems }) => {
    const me = await createUser();
    const mobileUser = await createMobileUser();
    await login(page, me);
    await page.goto(`/profile/${mobileUser.uid}`);
    await expect(page.getByText(`@${mobileUser.username}`)).toBeVisible();
    expect(problems.filter((p) => p.startsWith("pageerror"))).toEqual([]);
  });

  test("connect sends a request to the other user", async ({ page }) => {
    knownBug("BUG-03", "updateUserProfile always adds updatedAt, which the new rules forbid on someone else's profile; Connect fails silently but the button says Connected");
    const me = await createUser();
    const other = await createUser();
    await login(page, me);
    await page.goto(`/profile/${other.uid}`);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect.poll(async () => (await getDoc(`users/${other.uid}`)).connectionRequests).toContain(me.uid);
    await expect.poll(() => listDocs(`users/${other.uid}/notifications`)).toHaveLength(1);
  });

  test("accepting a connection can update the requester's profile", async () => {
    knownBug("BUG-03", "same updatedAt problem when NotificationItem writes the requester's connections");
    const me = await createUser();
    const requester = await createUser();
    const c = await clientFor(me);
    // Exactly what updateUserProfile sends for the requester's side.
    await c.updateDoc(c.doc(c.db, "users", requester.uid), {
      connections: [me.uid],
      updatedAt: new Date(),
    });
  });

  test("reporting a user is recorded", async ({ page }) => {
    knownBug("BUG-12", "Report writes reportedBy/reports/isBlocked on someone else's profile; the deployed rules deny it and the UI still says Reported");
    const me = await createUser();
    const other = await createUser();
    await login(page, me);
    await page.goto(`/profile/${other.uid}`);
    await page.getByRole("button", { name: "Report" }).click();
    await page.waitForTimeout(1500);
    const profile = await getDoc(`users/${other.uid}`);
    expect(profile.reportedBy ?? profile.reported).toBeTruthy();
  });

  test("an unknown profile id shows a not-found state", async ({ page }) => {
    knownBug("BUG-14", "an unknown profile id renders an empty page");
    const me = await createUser();
    await login(page, me);
    await page.goto("/profile/nobody-here");
    await expect(page.getByText(/not found|doesn't exist|no user/i).first()).toBeVisible();
  });
});
