import { test, expect, login, knownBug } from "../support/fixtures.js";
import { createUser, createCircle, adminDb, listDocs, getDoc, Timestamp, clientFor } from "../support/emulator.js";

// Expected flow (decided 2026-10-08, same on web and mobile): activity poll,
// then place poll; when the place poll closes an event is created as
// "pending" and the poll stage becomes "Pending Confirmation". Only a circle
// admin/owner confirms it, which sets the event to "confirmed" and the poll
// stage to "Event Confirmed".

const RSVP_YES = "Going";

const tomorrow = () => Timestamp.fromDate(new Date(Date.now() + 24 * 3600 * 1000));

async function seedPoll(circleId, data) {
  const ref = adminDb.collection(`circles/${circleId}/polls`).doc();
  await ref.set({ timestamp: Timestamp.now(), timeStamp: Timestamp.now(), ...data });
  return ref.id;
}

function activityPoll(votes = {}, deadline = tomorrow()) {
  return {
    question: "What should we do?",
    options: [{ text: "Bowling" }, { text: "Cinema" }],
    deadline,
    allowMultiple: false,
    allowNewOptions: true,
    pollType: "activity",
    votes,
  };
}

async function setup({ withMember = true } = {}) {
  const owner = await createUser();
  const member = await createUser();
  const circle = await createCircle(owner, {}, withMember ? [member] : []);
  return { owner, member, circle };
}

async function openCircle(page, user, circleId) {
  await login(page, user);
  await page.goto(`/circles/${circleId}`);
  await expect(page.getByPlaceholder("Type a message...")).toBeVisible();
}

test.describe("event planning", () => {
  test("owner starts an activity poll from the chat", async ({ page }) => {
    const { owner, circle } = await setup();
    await openCircle(page, owner, circle.id);

    await page.locator(".tooltip-container").click();
    const modal = page.locator("form").filter({ hasText: "Question *" });
    const inputs = modal.locator("input#input");
    await inputs.nth(0).fill("What should we do?");
    await inputs.nth(1).fill("Bowling");
    await inputs.nth(2).fill("Cinema");
    await modal.locator("button").last().click();

    await expect(page.getByText("What should we do?").first()).toBeVisible();
    const polls = await listDocs(`circles/${circle.id}/polls`);
    expect(polls).toHaveLength(1);
    expect(polls[0]).toMatchObject({
      stage: "Planning the Activity",
      activityPoll: expect.objectContaining({ question: "What should we do?", options: [{ text: "Bowling" }, { text: "Cinema" }] }),
    });
    await expect(page.getByText(/Activity poll started/)).toBeVisible();
  });

  test("poll needs a question and two options", async ({ page }) => {
    const { owner, circle } = await setup();
    await openCircle(page, owner, circle.id);
    const dialogs = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss(); });
    await page.locator(".tooltip-container").click();
    const modal = page.locator("form").filter({ hasText: "Question *" });
    await modal.locator("input#input").nth(0).fill("Only one option?");
    await modal.locator("input#input").nth(1).fill("Bowling");
    await modal.locator("button").last().click();
    await expect.poll(() => dialogs).toContain("Please provide at least two options.");
    expect(await listDocs(`circles/${circle.id}/polls`)).toHaveLength(0);
  });

  test("members vote and the vote is stored per user", async ({ page }) => {
    const { owner, member, circle } = await setup();
    const pollId = await seedPoll(circle.id, { stage: "Planning the Activity", activityPoll: activityPoll() });
    await openCircle(page, member, circle.id);
    await page.getByText("Cinema", { exact: true }).click();
    await expect.poll(async () => (await getDoc(`circles/${circle.id}/polls/${pollId}`)).activityPoll.votes)
      .toEqual({ [member.uid]: "Cinema" });
    await expect(page.getByText("1 votes").first()).toBeVisible();
    void owner;
  });

  test("members can add an option while the poll is open", async ({ page }) => {
    const { member, circle } = await setup();
    const pollId = await seedPoll(circle.id, { stage: "Planning the Activity", activityPoll: activityPoll() });
    await openCircle(page, member, circle.id);
    await page.getByRole("button", { name: "Add Option" }).click();
    await page.getByPlaceholder("Add new option...").fill("Karaoke");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect.poll(async () => (await getDoc(`circles/${circle.id}/polls/${pollId}`)).activityPoll.options)
      .toContainEqual({ text: "Karaoke" });
  });

  test("closing the activity poll picks the winner", async ({ page }) => {
    const { owner, member, circle } = await setup();
    const pollId = await seedPoll(circle.id, {
      stage: "Planning the Activity",
      activityPoll: activityPoll({ [owner.uid]: "Cinema", [member.uid]: "Cinema" }),
    });
    await openCircle(page, owner, circle.id);
    await page.getByRole("button", { name: "Send Vote" }).click();
    await expect(page.getByText("Poll Closed! The winner is...")).toBeVisible();
    await expect.poll(() => getDoc(`circles/${circle.id}/polls/${pollId}`))
      .toMatchObject({ stage: "Activity Poll Closed", winningActivity: "Cinema" });
  });

  test("closing the place poll creates a pending event, not a confirmed one", async ({ page }) => {
    const { owner, member, circle } = await setup();
    const pollId = await seedPoll(circle.id, {
      stage: "Place Poll Closed",
      activityPoll: activityPoll({ [owner.uid]: "Cinema" }),
      winningActivity: "Cinema",
      placePoll: { ...activityPoll({ [owner.uid]: "City Stars" }), question: "Where?", options: [{ text: "City Stars" }, { text: "Mall of Egypt" }], pollType: "place" },
      winningPlace: "City Stars",
    });
    await openCircle(page, member, circle.id);
    await page.getByText("Poll Closed! The winner is...").waitFor();
    await page.getByRole("button", { name: "Finalize Event & Get RSVPs" }).click();

    await expect.poll(async () => (await getDoc(`circles/${circle.id}/polls/${pollId}`)).stage)
      .toBe("Pending Confirmation");
    const events = await listDocs(`circles/${circle.id}/events`);
    expect(events).toEqual([
      expect.objectContaining({ status: "pending", activity: "Cinema", place: "City Stars", createdBy: member.uid }),
    ]);
    await expect(page.getByText(/A circle admin confirms the event/)).toBeVisible();
  });

  test("a regular member cannot confirm a pending event", async ({ page }) => {
    const { owner, member, circle } = await setup();
    await seedPendingEvent(circle.id, owner);
    await openCircle(page, member, circle.id);
    const badge = page.getByTitle("Waiting for an admin to confirm");
    await expect(badge).toBeVisible();
    await badge.click();
    await expect(page.getByText("Confirm Event")).toHaveCount(0);

    // The rules back this up even outside the UI.
    const events = await listDocs(`circles/${circle.id}/events`);
    const c = await clientFor(member);
    await expect(
      c.updateDoc(c.doc(c.db, "circles", circle.id, "events", events[0].id), { status: "confirmed" }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  test("the owner confirms a pending event and the poll moves to Event Confirmed", async ({ page }) => {
    const { owner, circle } = await setup();
    const { pollId, eventId } = await seedPendingEvent(circle.id, owner);
    await openCircle(page, owner, circle.id);
    await page.getByText("pending", { exact: true }).click();
    const day = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const form = page.locator("form").filter({ has: page.locator('input[type="date"]') });
    await form.locator('input[type="date"]').fill(day);
    await form.locator('button[type="submit"], button:not([type])').last().click();

    await expect.poll(() => getDoc(`circles/${circle.id}/events/${eventId}`))
      .toMatchObject({ status: "confirmed", day });
    await expect.poll(async () => (await getDoc(`circles/${circle.id}/polls/${pollId}`)).stage)
      .toBe("Event Confirmed");
  });

  test("members RSVP to a confirmed event", async ({ page }) => {
    const { owner, member, circle } = await setup();
    const { eventId } = await seedPendingEvent(circle.id, owner, { confirmed: true });
    await openCircle(page, member, circle.id);
    await expect(page.getByText("Will you be joining us?")).toBeVisible();
    await page.getByTitle(RSVP_YES, { exact: true }).click();
    await expect.poll(async () => (await getDoc(`circles/${circle.id}/events/${eventId}`)).rsvps)
      .toEqual({ [member.uid]: "yes" });
  });
});

async function seedPendingEvent(circleId, owner, { confirmed = false } = {}) {
  const pollId = await seedPoll(circleId, {
    stage: confirmed ? "Event Confirmed" : "Pending Confirmation",
    activityPoll: activityPoll({ [owner.uid]: "Cinema" }),
    winningActivity: "Cinema",
    winningPlace: "City Stars",
    rsvps: {},
  });
  const ref = adminDb.collection(`circles/${circleId}/events`).doc();
  const day = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  await ref.set({
    title: "Cinema",
    activity: "Cinema",
    location: "City Stars",
    place: "City Stars",
    status: confirmed ? "confirmed" : "pending",
    createdBy: owner.uid,
    createdAt: Timestamp.now(),
    rsvps: {},
    ...(confirmed ? { day } : {}),
  });
  return { pollId, eventId: ref.id };
}

test.describe("planning bugs found by the audit", () => {
  test("a member pressing \"Send Vote\" does not end the poll for everyone", async ({ page }) => {
    knownBug("BUG-08", "the button that closes the poll for the whole circle is labelled \"Send Vote\" and any member can press it");
    const { member, circle } = await setup();
    const pollId = await seedPoll(circle.id, { stage: "Planning the Activity", activityPoll: activityPoll() });
    await openCircle(page, member, circle.id);
    await page.getByText("Bowling", { exact: true }).click();
    await page.getByRole("button", { name: "Send Vote" }).click();
    await page.waitForTimeout(1500);
    expect((await getDoc(`circles/${circle.id}/polls/${pollId}`)).stage).toBe("Planning the Activity");
  });

  test("a vote cast from stale state does not erase other members' votes", async ({ page }) => {
    knownBug("BUG-09", "handleVote rewrites the whole votes map from local state, so a vote sent from a briefly offline or slow client wipes votes cast meanwhile");
    const { owner, member, circle } = await setup();
    const pollId = await seedPoll(circle.id, { stage: "Planning the Activity", activityPoll: activityPoll() });
    await openCircle(page, member, circle.id);
    await expect(page.getByText("Bowling", { exact: true })).toBeVisible();

    // The member's connection drops; meanwhile the owner votes.
    await page.context().setOffline(true);
    await adminDb.doc(`circles/${circle.id}/polls/${pollId}`).update({ [`activityPoll.votes.${owner.uid}`]: "Bowling" });
    await page.getByText("Cinema", { exact: true }).click();
    await page.context().setOffline(false);

    await expect.poll(async () => (await getDoc(`circles/${circle.id}/polls/${pollId}`)).activityPoll.votes[member.uid])
      .toBe("Cinema");
    const votes = (await getDoc(`circles/${circle.id}/polls/${pollId}`)).activityPoll.votes;
    expect(votes).toEqual({ [owner.uid]: "Bowling", [member.uid]: "Cinema" });
  });

  test("a poll whose deadline passed can still be closed", async ({ page }) => {
    knownBug("BUG-10", "after the deadline the only way forward is disabled (\"Poll Ended\"), so planning is stuck");
    const { owner, circle } = await setup();
    const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 3600 * 1000));
    await seedPoll(circle.id, {
      stage: "Planning the Activity",
      activityPoll: activityPoll({ [owner.uid]: "Bowling" }, yesterday),
    });
    await openCircle(page, owner, circle.id);
    await expect(page.getByText(/Poll Closed|winner/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("\"Allow multiple answers\" lets a member pick two options", async ({ page }) => {
    knownBug("BUG-11", "the allowMultiple toggle is saved but voting always stores a single option per user");
    const { member, circle } = await setup();
    const pollId = await seedPoll(circle.id, {
      stage: "Planning the Activity",
      activityPoll: { ...activityPoll(), allowMultiple: true },
    });
    await openCircle(page, member, circle.id);
    await page.getByText("Bowling", { exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByText("Cinema", { exact: true }).click();
    await page.waitForTimeout(1000);
    const vote = (await getDoc(`circles/${circle.id}/polls/${pollId}`)).activityPoll.votes[member.uid];
    expect(vote).toEqual(expect.arrayContaining(["Bowling", "Cinema"]));
  });
});
