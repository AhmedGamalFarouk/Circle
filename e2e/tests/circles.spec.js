import { test, expect, login, knownBug } from "../support/fixtures.js";
import { createUser, createCircle, listDocs, getDoc, uniqueName } from "../support/emulator.js";

// The "+" next to the search box is a plain div with no role or label.
async function openCreateCircle(page) {
  await page.getByPlaceholder("Search circles...").locator("xpath=following-sibling::div[1]").click();
}

async function pickOption(combobox, text) {
  await combobox.click();
  await combobox.fill(text);
  await combobox.press("Enter");
}

test.describe("circles", () => {
  test("a user can create a public circle and becomes its admin", async ({ page }) => {
    const owner = await createUser();
    await login(page, owner);
    await page.goto("/circles");
    await openCreateCircle(page);

    const form = page.locator("form").filter({ hasText: "Create Circle" });
    const name = uniqueName("Hikers ");
    await form.getByPlaceholder("enter circle name").fill(name);
    await pickOption(form.getByRole("combobox").nth(0), "permenent");
    await pickOption(form.getByRole("combobox").nth(1), "public");
    await form.getByPlaceholder("what's this circle about?").fill("Weekend hikes around Cairo");
    await form.getByRole("button", { name: "Football" }).click();
    await form.getByRole("button", { name: "Create Circle" }).click();

    await expect(page.getByText("Circle created successfully!")).toBeVisible();
    const circles = await listDocs("circles");
    const created = circles.find((c) => c.circleName === name);
    expect(created).toMatchObject({
      createdBy: owner.uid,
      circlePrivacy: "public",
      circleType: "permanent",
    });
    const member = await getDoc(`circles/${created.id}/members/${owner.uid}`);
    expect(member).not.toBeNull();
    const profile = await getDoc(`users/${owner.uid}`);
    expect(profile.joinedCircles).toContain(created.id);

    await page.reload();
    await expect(page.getByText(name)).toBeVisible();
  });

  test("a newly created circle shows up without reloading", async ({ page }) => {
    knownBug("BUG-05", "My Circles keeps showing the old list after creating a circle until the page is reloaded");
    const owner = await createUser();
    await login(page, owner);
    await page.goto("/circles");
    await openCreateCircle(page);
    const form = page.locator("form").filter({ hasText: "Create Circle" });
    const name = uniqueName("Fresh ");
    await form.getByPlaceholder("enter circle name").fill(name);
    await pickOption(form.getByRole("combobox").nth(0), "permenent");
    await pickOption(form.getByRole("combobox").nth(1), "public");
    await form.getByPlaceholder("what's this circle about?").fill("Fresh circle");
    await form.getByRole("button", { name: "Football" }).click();
    await form.getByRole("button", { name: "Create Circle" }).click();
    await expect(page.getByText("Circle created successfully!")).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
  });

  test("create-circle form validates required fields", async ({ page }) => {
    const owner = await createUser();
    await login(page, owner);
    await page.goto("/circles");
    await openCreateCircle(page);
    const form = page.locator("form").filter({ hasText: "Create Circle" });
    await form.getByRole("button", { name: "Create Circle" }).click();
    await expect(form.locator(".text-red-500").first()).toBeVisible();
    expect(await listDocs("circles")).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ createdBy: owner.uid })]),
    );
  });

  test("my circles lists only circles the user belongs to", async ({ page }) => {
    const me = await createUser();
    const stranger = await createUser();
    const mine = await createCircle(me, { circleName: uniqueName("Mine ") });
    const theirs = await createCircle(stranger, { circleName: uniqueName("Theirs ") });
    await login(page, me);
    await page.goto("/circles");
    await expect(page.getByText(mine.circleName)).toBeVisible();
    await expect(page.getByText(theirs.circleName)).toHaveCount(0);
  });

  test("search filters the circle list", async ({ page }) => {
    const me = await createUser();
    const a = await createCircle(me, { circleName: uniqueName("Alpha ") });
    const b = await createCircle(me, { circleName: uniqueName("Bravo ") });
    await login(page, me);
    await page.goto("/circles");
    await page.getByPlaceholder("Search circles...").fill("Alpha");
    await expect(page.getByText(a.circleName)).toBeVisible();
    await expect(page.getByText(b.circleName)).toHaveCount(0);
  });

  test("logged-out visitors are sent to login instead of an empty circles page", async ({ page }) => {
    knownBug("BUG-06", "signed-out /circles renders an empty page; circles can only be read when signed in");
    await page.goto("/circles");
    // Rules only let signed-in users read circles, so the page can't show
    // anything to a visitor. It should say so or redirect, not render blank.
    await expect(page.getByText(/sign in|log in|login/i).first()).toBeVisible();
  });

  test("the owner can delete their circle", async ({ page }) => {
    const me = await createUser();
    const c = await createCircle(me, { circleName: uniqueName("Doomed ") });
    await login(page, me);
    await page.goto("/circles");
    const card = page.locator("div").filter({ hasText: c.circleName }).last();
    await page.getByTitle("Delete Circle").first().click();
    const confirm = page.getByRole("button", { name: /delete|yes|confirm/i }).last();
    await confirm.click();
    await expect.poll(() => getDoc(`circles/${c.id}`)).toBeNull();
    await expect(card).toHaveCount(0);
  });
});

test.describe("circle access", () => {
  test("a non-member opening a private circle URL is not shown its chat", async ({ page, problems }) => {
    const owner = await createUser();
    const outsider = await createUser();
    const c = await createCircle(owner, { circlePrivacy: "private" });
    await login(page, outsider);
    await page.goto(`/circles/${c.id}`);
    await expect(page.getByPlaceholder("Type a message...")).toHaveCount(0);
    // The page should explain, not spray permission errors.
    expect(problems.filter((p) => p.startsWith("pageerror"))).toEqual([]);
  });

  test("an unknown circle id shows a not-found state", async ({ page }) => {
    knownBug("BUG-13", "an unknown circle id shows loading skeletons forever with a live message box");
    const me = await createUser();
    await login(page, me);
    await page.goto("/circles/does-not-exist");
    await expect(page.getByText(/not found|doesn't exist|does not exist/i).first()).toBeVisible();
  });
});
