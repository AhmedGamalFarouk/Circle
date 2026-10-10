# End-to-end tests (Playwright)

The suite drives the real web app in Chromium against local Firebase
emulators (Auth, Firestore, Realtime Database) loaded with the same security
rules that are deployed to production. It never touches live data: in e2e mode
the app switches to the `demo-circle` project, which can't reach real
Firebase services, and every request to the internet (images, fonts, map
tiles, Cloudinary) is stubbed.

## Running

Needs Node 22 and Java 21+ (for the emulators).

```bash
npm ci
npx playwright install chromium   # once
npm run test:e2e                  # starts the emulators, runs everything
npm run test:e2e:ui               # same, in Playwright's UI mode
```

To iterate faster, keep the emulators running in one terminal and run
Playwright directly in another:

```bash
npm run e2e:emulators
npx playwright test e2e/tests/chat.spec.js
```

`npx playwright show-report` opens the HTML report with traces, screenshots
and videos of any failure.

## Layout

| Path | What it is |
| --- | --- |
| `e2e/firebase/` | Emulator config plus a copy of `firestore.rules` and `database.rules.json` from Circle-mobile (`claude/project-thread-cy7tq3`, invitation-only self-join). Copy them again whenever the mobile rules change. |
| `e2e/support/emulator.js` | Seeding and inspection through the Admin SDK (bypasses rules), plus `clientFor(user)` for checks that must go through the rules. |
| `e2e/support/fixtures.js` | The `page` fixture (offline stubbing, error capture), `login()` and `knownBug()`. |
| `e2e/tests/*.spec.js` | Auth, circles, membership, chat, event planning, profile, smoke and phone-size tests. |
| `.env.e2e` | Sets `VITE_USE_FIREBASE_EMULATORS=true`, read by `src/firebase-config.js`. |

## Known bugs

Tests that reproduce an unfixed bug call `knownBug(id, summary)`. They are
expected to fail, so the suite stays green. When a fix lands the test starts
passing, Playwright reports it as "expected to fail, but passed", and the
`knownBug(...)` line should be deleted. Run `E2E_STRICT=1 npm run test:e2e` to
see their real failures.

No known bugs are open right now.

The audit's findings were fixed alongside this suite and are now covered
by ordinary tests: registration under the new rules, cross-user profile writes
(Connect, accepting connections, Report), the login redirect, route
protection, circle and profile not-found pages, My Circles refresh, co-admin
join requests, the poll close button, lost votes, polls stuck after their
deadline, the Events calendar, and private circles that anyone could join
(the rules now require a pending invitation).

The "Skip Authentication" button signs in to a dedicated demo account
(`src/utils/demoAccount.js`). In e2e mode `.env.e2e` points it at a user the
auth test creates.
