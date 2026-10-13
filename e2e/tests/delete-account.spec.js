import { test, expect, login } from "../support/fixtures.js";
import { adminAuth, adminDb, createUser, createCircle, getDoc, Timestamp } from "../support/emulator.js";

// SPEC C1: account deletion through the UI and /api/delete-account.

async function deleteThroughUi(page, user) {
  await page.goto("/account/delete");
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Delete my account" }).click();
}

const authGone = (uid) => adminAuth.getUser(uid).then(() => false, () => true);

test.describe("account deletion", () => {
  test("an owner with another member: the circle survives under the new owner", async ({ page }) => {
    const me = await createUser();
    const pal = await createUser();
    const circle = await createCircle(me, { circlePrivacy: "private" }, [pal]);
    await login(page, me);
    await deleteThroughUi(page, me);
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => authGone(me.uid)).toBe(true);
    expect((await getDoc(`circles/${circle.id}`)).createdBy).toBe(pal.uid);
    expect(await getDoc(`circles/${circle.id}/members/${me.uid}`)).toBeNull();
    expect(await getDoc(`users/${me.uid}`)).toBeNull();
  });

  test("a sole-member owner: the circle and its pending invitation are gone", async ({ page }) => {
    const me = await createUser();
    const other = await createUser();
    const circle = await createCircle(me, { circlePrivacy: "private" });
    await adminDb.doc(`circles/${circle.id}/chat/m1`).set({ text: "hi" });
    const invite = await adminDb.collection("circleRequests").add({
      type: "invitation", circleId: circle.id, inviterId: me.uid, invitedUserId: other.uid, status: "pending", createdAt: Timestamp.now(),
    });
    await login(page, me);
    await deleteThroughUi(page, me);
    await expect.poll(() => authGone(me.uid)).toBe(true);
    expect(await getDoc(`circles/${circle.id}`)).toBeNull();
    expect(await getDoc(`circles/${circle.id}/chat/m1`)).toBeNull();
    expect(await getDoc(`circleRequests/${invite.id}`)).toBeNull();
  });

  test("a failed step shows which one, and Retry finishes", async ({ page }) => {
    const me = await createUser();
    let first = true;
    await page.route("**/api/delete-account", (route) => {
      const headers = { ...route.request().headers() };
      if (first) headers["x-test-fail-step"] = "memberships";
      first = false;
      route.continue({ headers });
    });
    await login(page, me);
    await deleteThroughUi(page, me);
    await expect(page.getByRole("alert")).toContainText("your memberships");
    expect(await authGone(me.uid)).toBe(false);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => authGone(me.uid)).toBe(true);
  });

  test("profile deleted but sign-in left: the next sign-in lands on the finish screen", async ({ page }) => {
    const me = await createUser();
    await adminDb.doc(`users/${me.uid}/private/deletionJob`).set({ circleIds: [], newOwners: {}, done: ["ownedCircles", "votes", "memberships", "relationships", "requests", "media", "profile"] });
    await adminDb.doc(`users/${me.uid}`).delete();
    await login(page, me);
    await expect(page.getByRole("heading", { name: "Finish deleting your account" })).toBeVisible();
    await page.getByLabel("Password").fill(me.password);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect.poll(() => authGone(me.uid)).toBe(true);
  });
});
