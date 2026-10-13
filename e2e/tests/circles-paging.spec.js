import { test, expect, login } from "../support/fixtures.js";
import { adminDb, createUser, createCircle, uniqueName, Timestamp } from "../support/emulator.js";

// C11 + D4: joined circles come from member docs, public circles load 24 at a time.

test.describe("circle lists (C11 + D4)", () => {
  test("my circles shows a private circle joined only through a member doc", async ({ page }) => {
    const me = await createUser();
    const owner = await createUser();
    const c = await createCircle(owner, { circlePrivacy: "private", circleName: uniqueName("Invited ") });
    // Like a web invite: member doc only, no joinedCircles entry on the profile.
    await adminDb.doc(`circles/${c.id}/members/${me.uid}`).set({
      userId: me.uid, isAdmin: false, isOwner: false, joinedAt: Timestamp.now(),
    });
    await login(page, me);
    await page.goto("/circles");
    await expect(page.getByText(c.circleName)).toBeVisible();
  });

  test("for you pages public circles with Load more and never shows others' private circles", async ({ page, problems }) => {
    const me = await createUser();
    const owner = await createUser();
    const base = Date.now();
    const created = [];
    for (let i = 0; i < 26; i++) {
      created.push(await createCircle(owner, {
        circleName: uniqueName(`Paged${String(i).padStart(2, "0")} `),
        createdAt: Timestamp.fromMillis(base + i * 1000),
      }));
    }
    const secret = await createCircle(owner, {
      circlePrivacy: "private",
      circleName: uniqueName("Secret "),
      createdAt: Timestamp.fromMillis(base + 60_000),
    });
    const oldest = created[0]; // 26th newest: on page 2

    await login(page, me);
    await page.goto("/circles");
    await page.getByRole("button", { name: "For You" }).click();
    await expect(page.getByText(created[25].circleName)).toBeVisible();
    await expect(page.getByText(oldest.circleName)).toHaveCount(0);
    await expect(page.getByText(secret.circleName)).toHaveCount(0);

    await page.getByRole("button", { name: "Load more circles" }).click();
    await expect(page.getByText(oldest.circleName)).toBeVisible();
    await expect(page.getByText(secret.circleName)).toHaveCount(0);
    expect(problems.filter((p) => p.startsWith("pageerror"))).toEqual([]);

    // Deep link to a circle beyond the first page loads it instead of hanging.
    await page.goto(`/circles/${oldest.id}`);
    await expect(page.getByText(oldest.circleName).first()).toBeVisible();
  });

  test("the explore page loads with member-doc circles", async ({ page, problems }) => {
    const me = await createUser();
    await createCircle(me);
    await login(page, me);
    await page.goto("/explore");
    await expect(page.locator("body")).not.toBeEmpty();
    expect(problems.filter((p) => p.startsWith("pageerror"))).toEqual([]);
  });
});
