import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMessage, normalizeCircle, normalizeUser, ageFrom, getWinningOption } from "./schema.mjs";

const NOW = new Date(2026, 9, 12);

test("normalizeUser: web-only profile is unchanged", () => {
    const u = normalizeUser({ connections: ["a"], connectionRequests: [{ uid: "b", username: "B" }], age: 30 }, NOW);
    assert.deepEqual(u.connections, ["a"]);
    assert.deepEqual(u.connectionRequests, [{ uid: "b", username: "B" }]);
    assert.equal(u.age, 30);
});

test("normalizeUser: mobile-only profile maps friends and the friendRequests map", () => {
    const u = normalizeUser({ friends: ["a"], friendRequests: { sent: ["x"], received: ["b"] } }, NOW);
    assert.deepEqual(u.connections, ["a"]);
    assert.deepEqual(u.connectionRequests, [{ uid: "b" }]);
});

test("normalizeUser: both shapes present → union by uid", () => {
    const u = normalizeUser({
        connections: ["a", "b"],
        friends: ["b", "c"],
        connectionRequests: [{ uid: "d", username: "D" }, "e"],
        friendRequests: ["d", "f"],
    }, NOW);
    assert.deepEqual(u.connections, ["a", "b", "c"]);
    assert.deepEqual(u.connectionRequests, [{ uid: "d", username: "D" }, { uid: "e" }, { uid: "f" }]);
});

test("normalizeUser: neither shape → empty lists", () => {
    const u = normalizeUser({}, NOW);
    assert.deepEqual(u.connections, []);
    assert.deepEqual(u.connectionRequests, []);
    assert.equal(u.age, null);
});

test("normalizeUser: age falls back to a public dateOfBirth (ISO or Timestamp)", () => {
    assert.equal(normalizeUser({ dateOfBirth: "2000-10-13" }, NOW).age, 25);
    assert.equal(normalizeUser({ dateOfBirth: { toDate: () => new Date(2000, 9, 12) } }, NOW).age, 26);
    assert.equal(ageFrom("not a date", NOW), null);
});

test("normalizeCircle: legacy privacy values and missing privacy", () => {
    assert.equal(normalizeCircle({ circlePrivacy: "عام" }).circlePrivacy, "public");
    assert.equal(normalizeCircle({ circlePrivacy: "خاص" }).circlePrivacy, "private");
    assert.equal(normalizeCircle({}).circlePrivacy, "public");
    assert.equal(normalizeCircle({ circleType: "permenent" }).circleType, "permanent");
    assert.equal(normalizeCircle({ circleType: "flash" }).circleType, "flash");
});

test("normalizeMessage: mobile voice message with mediaUrl and reactions", () => {
    const m = normalizeMessage({
        messageType: "voice",
        mediaUrl: "u",
        reactions: [{ userId: "a", emoji: "x" }],
        react: [{ userId: "a", emoji: "x" }],
        timeStamp: { toDate: () => new Date(2026, 0, 1, 14, 5) },
    });
    assert.equal(m.messageType, "audio");
    assert.equal(m.audioUrl, "u");
    assert.equal(m.react.length, 1);
    assert.match(m.sentTime, /02:05 PM/);
});

test("getWinningOption: majority, tie and empty", () => {
    assert.equal(getWinningOption({ a: "Bowling", b: "Cinema", c: "Cinema" }), "Cinema");
    assert.equal(getWinningOption({ a: "Bowling", b: "Cinema" }), "Cinema");
    assert.equal(getWinningOption({}), null);
    assert.equal(getWinningOption(undefined), null);
    assert.equal(getWinningOption({ a: null, b: "", c: "Cinema" }), "Cinema");
    assert.equal(getWinningOption({ a: null }), null);
});
