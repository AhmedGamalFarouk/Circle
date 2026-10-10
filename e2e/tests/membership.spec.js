import { test, expect, login, knownBug } from "../support/fixtures.js";
import {
  createUser, createMobileUser, createCircle, addMember, listDocs, getDoc, adminDb, Timestamp, uniqueName, clientFor,
} from "../support/emulator.js";

const requestsFor = async (circleId) =>
  (await listDocs("circleRequests")).filter((r) => r.circleId === circleId);

test.describe("joining circles", () => {
  test("join request: user asks, owner accepts, user becomes a member", async ({ page, browser }) => {
    const owner = await createUser();
    const joiner = await createUser();
    const circle = await createCircle(owner, { circleName: uniqueName("Open ") });

    await login(page, joiner);
    await page.goto("/circles");
    await page.getByText("For You", { exact: true }).click();
    // Other tests' circles share the emulator, so search to skip pagination.
    await page.getByPlaceholder("Search circles...").fill(circle.circleName);
    const card = page.locator("div.bg-main.rounded-3xl").filter({ hasText: circle.circleName });
    await card.getByRole("button", { name: "Join Circle" }).click();
    await expect(card.getByRole("button", { name: "Request Sent" })).toBeVisible();

    const requests = await requestsFor(circle.id);
    expect(requests).toEqual([
      expect.objectContaining({
        type: "join-request",
        circleId: circle.id,
        requesterId: joiner.uid,
        approverId: owner.uid,
        status: "pending",
      }),
    ]);

    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, owner);
    await ownerPage.goto("/circles-requests");
    await expect(ownerPage.getByText(joiner.username).first()).toBeVisible();
    await ownerPage.getByRole("button", { name: "Accept request" }).click();
    await expect(ownerPage.getByText(joiner.username)).toHaveCount(0);

    await expect.poll(() => getDoc(`circles/${circle.id}/members/${joiner.uid}`)).not.toBeNull();
    expect((await getDoc(`users/${joiner.uid}`)).joinedCircles).toContain(circle.id);
    expect(await requestsFor(circle.id)).toHaveLength(0);
    await ownerContext.close();

    await page.goto(`/circles/${circle.id}`);
    await expect(page.getByPlaceholder("Type a message...")).toBeVisible();
  });

  test("owner can decline a join request", async ({ page }) => {
    const owner = await createUser();
    const joiner = await createUser();
    const circle = await createCircle(owner);
    await adminDb.collection("circleRequests").add({
      type: "join-request",
      circleId: circle.id,
      circleName: circle.circleName,
      requesterId: joiner.uid,
      requesterUsername: joiner.username,
      approverId: owner.uid,
      status: "pending",
      createdAt: Timestamp.now(),
    });
    await login(page, owner);
    await page.goto("/circles-requests");
    await page.getByRole("button", { name: "Decline request" }).click();
    await expect.poll(() => requestsFor(circle.id)).toHaveLength(0);
    expect(await getDoc(`circles/${circle.id}/members/${joiner.uid}`)).toBeNull();
  });

  test("a co-admin also sees join requests for the circle", async ({ page }) => {
    const owner = await createUser();
    const coAdmin = await createUser();
    const joiner = await createUser();
    const circle = await createCircle(owner, {}, []);
    await addMember(circle.id, coAdmin, { isAdmin: true });
    await adminDb.collection("circleRequests").add({
      type: "join-request", circleId: circle.id, circleName: circle.circleName,
      requesterId: joiner.uid, requesterUsername: joiner.username,
      approverId: owner.uid, status: "pending", createdAt: Timestamp.now(),
    });
    await login(page, coAdmin);
    await page.goto("/circles-requests");
    await expect(page.getByText(joiner.username).first()).toBeVisible();
  });

  test("invitation: invitee accepts and becomes a member", async ({ page }) => {
    const owner = await createUser();
    const invitee = await createUser();
    const circle = await createCircle(owner, { circlePrivacy: "private" });
    await adminDb.collection("circleRequests").add({
      type: "invitation",
      circleId: circle.id,
      circleName: circle.circleName,
      inviterId: owner.uid,
      invitedUserId: invitee.uid,
      invitedUserUsername: invitee.username,
      invitedUserEmail: invitee.email,
      invitedUserPhotoUrl: "",
      status: "pending",
      createdAt: Timestamp.now(),
    });
    await login(page, invitee);
    await page.goto("/circles-requests");
    await page.getByRole("button", { name: "Invitations" }).click();
    await expect(page.getByText(circle.circleName).first()).toBeVisible();
    await page.getByRole("button", { name: "Accept request" }).click();
    await expect.poll(() => getDoc(`circles/${circle.id}/members/${invitee.uid}`)).not.toBeNull();
  });

  test("a non-member cannot add themselves to a private circle", async () => {
    knownBug("BUG-RULES", "rules let anyone create their own member doc, so private circles can be self-joined");
    const owner = await createUser();
    const outsider = await createUser();
    const circle = await createCircle(owner, { circlePrivacy: "private" });
    const c = await clientFor(outsider);
    await expect(
      c.setDoc(c.doc(c.db, "circles", circle.id, "members", outsider.uid), { username: outsider.username }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  test("a user registered on mobile can request to join from the web", async ({ page }) => {
    const owner = await createUser();
    const joiner = await createMobileUser();
    const circle = await createCircle(owner, { circleName: uniqueName("Mixed ") });
    page.on("dialog", (d) => d.dismiss());
    await login(page, joiner);
    await page.goto("/circles");
    await page.getByText("For You", { exact: true }).click();
    // Other tests' circles share the emulator, so search to skip pagination.
    await page.getByPlaceholder("Search circles...").fill(circle.circleName);
    const card = page.locator("div.bg-main.rounded-3xl").filter({ hasText: circle.circleName });
    await card.getByRole("button", { name: "Join Circle" }).click();
    await expect(card.getByRole("button", { name: "Request Sent" })).toBeVisible();
    expect(await requestsFor(circle.id)).toEqual([
      expect.objectContaining({ requesterId: joiner.uid, requesterUsername: joiner.username }),
    ]);
  });
});

test.describe("leaving circles", () => {
  test("a member can leave a circle", async ({ page }) => {
    const owner = await createUser();
    const member = await createUser();
    const circle = await createCircle(owner, {}, [member]);
    await login(page, member);
    await page.goto(`/circles/${circle.id}`);
    await page.locator("button:has(svg.lucide-ellipsis-vertical), button:has(svg.lucide-more-vertical)").first().click();
    await page.getByText(/leave/i).first().click();
    const confirm = page.getByRole("button", { name: /leave|yes|confirm/i }).last();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect.poll(() => getDoc(`circles/${circle.id}/members/${member.uid}`)).toBeNull();
  });
});
