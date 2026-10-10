import { test, expect, login } from "../support/fixtures.js";
import { createUser, createCircle, listDocs } from "../support/emulator.js";

test.describe("circle chat", () => {
  test("members exchange messages in real time", async ({ page, browser }) => {
    const owner = await createUser();
    const friend = await createUser();
    const circle = await createCircle(owner, {}, [friend]);

    await login(page, owner);
    await page.goto(`/circles/${circle.id}`);

    const friendContext = await browser.newContext();
    const friendPage = await friendContext.newPage();
    await login(friendPage, friend);
    await friendPage.goto(`/circles/${circle.id}`);

    const box = page.getByPlaceholder("Type a message...");
    await box.fill("Hello from the owner");
    await box.press("Enter");
    await expect(page.getByText("Hello from the owner")).toBeVisible();
    await expect(friendPage.getByText("Hello from the owner")).toBeVisible();

    const friendBox = friendPage.getByPlaceholder("Type a message...");
    await friendBox.fill("Hi back");
    await friendBox.press("Enter");
    await expect(page.getByText("Hi back")).toBeVisible();

    // Mobile reads the same documents, so check the shared schema.
    const messages = await listDocs(`circles/${circle.id}/chat`);
    const first = messages.find((m) => m.text === "Hello from the owner");
    expect(first).toMatchObject({ user: expect.objectContaining({ userId: owner.uid }) });
    expect(first.timeStamp).toBeTruthy();

    await friendContext.close();
  });

  test("blank messages are not sent", async ({ page }) => {
    const owner = await createUser();
    const circle = await createCircle(owner);
    await login(page, owner);
    await page.goto(`/circles/${circle.id}`);
    const box = page.getByPlaceholder("Type a message...");
    await box.fill("   ");
    await box.press("Enter");
    await page.waitForTimeout(1000);
    expect(await listDocs(`circles/${circle.id}/chat`)).toHaveLength(0);
  });

  test("shift+enter adds a new line instead of sending", async ({ page }) => {
    const owner = await createUser();
    const circle = await createCircle(owner);
    await login(page, owner);
    await page.goto(`/circles/${circle.id}`);
    const box = page.getByPlaceholder("Type a message...");
    await box.fill("line one");
    await box.press("Shift+Enter");
    await box.pressSequentially("line two");
    await expect(box).toHaveValue("line one\nline two");
    await box.press("Enter");
    await expect.poll(async () => (await listDocs(`circles/${circle.id}/chat`)).map((m) => m.text)).toEqual([
      "line one\nline two",
    ]);
  });

  test("messages survive a reload in the right order", async ({ page }) => {
    const owner = await createUser();
    const circle = await createCircle(owner);
    await login(page, owner);
    await page.goto(`/circles/${circle.id}`);
    const box = page.getByPlaceholder("Type a message...");
    for (const text of ["first", "second", "third"]) {
      await box.fill(text);
      await box.press("Enter");
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    // Let the writes reach the server before reloading.
    await expect.poll(async () => (await listDocs(`circles/${circle.id}/chat`)).length).toBe(3);
    await page.reload();
    const texts = page.getByText(/^(first|second|third)$/);
    await expect(texts).toHaveCount(3);
    expect(await texts.allInnerTexts()).toEqual(["first", "second", "third"]);
  });
});
