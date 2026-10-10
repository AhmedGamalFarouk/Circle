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
| `e2e/firebase/` | Emulator config plus a copy of `firestore.rules` and `database.rules.json` from Circle-mobile (commit `3f4d5ca`). Copy them again whenever the mobile rules change. |
| `e2e/support/emulator.js` | Seeding and inspection through the Admin SDK (bypasses rules), plus `clientFor(user)` for checks that must go through the rules. |
| `e2e/support/fixtures.js` | The `page` fixture (offline stubbing, error capture), `login()` and `knownBug()`. |
| `e2e/tests/*.spec.js` | Auth, circles, membership, chat, event planning, profile, smoke and phone-size tests. |
| `.env.e2e` | Sets `VITE_USE_FIREBASE_EMULATORS=true`, read by `src/firebase-config.js`. |

## Known bugs

Tests that reproduce a bug found by the audit call `knownBug(id, summary)`.
They are expected to fail, so the suite stays green. When a fix lands the test
starts passing, Playwright reports it as "expected to fail, but passed", and
the `knownBug(...)` line should be deleted. Run `E2E_STRICT=1 npm run test:e2e`
to see their real failures.

| ID | Where | Bug |
| --- | --- | --- |
| BUG-01 | auth | "Skip Authentication" on the login page signs any visitor into a hard-coded real account; its password is in the source. |
| BUG-02 | auth | Registration is impossible: the username check reads `users` while signed out, the rules deny it, and every username shows as taken. |
| BUG-03 | profile | `updateUserProfile` always writes `updatedAt`, which the rules forbid on another user's profile, so Connect and accepting a connection fail silently. |
| BUG-04 | auth | `/login?redirect=…` is ignored; an auth listener on the login page always navigates to `/`. |
| BUG-05 | circles | A newly created circle doesn't appear in My Circles until the page is reloaded. |
| BUG-06 | routing | Signed-out visitors get blank or skeleton pages on member-only routes; `ProtectedRoute` is commented out. |
| BUG-07 | membership | Join requests are addressed to the owner only; co-admins never see them. |
| BUG-08 | planning | The button that closes a poll for the whole circle is labelled "Send Vote", and any member can press it. |
| BUG-09 | planning | Voting rewrites the whole votes map from local state, so a vote from a slow or briefly offline client erases other votes. |
| BUG-10 | planning | Once a poll's deadline passes, its only button is disabled ("Poll Ended") and planning is stuck. |
| BUG-11 | planning | "Allow multiple answers" is saved but ignored; each member can only hold one vote. |
| BUG-12 | profile | Report writes fields the rules deny on another user's profile; nothing is recorded but the button says "Reported". |
| BUG-13 | circles | An unknown circle id shows loading skeletons forever with a working message box. |
| BUG-14 | profile | An unknown profile id renders an empty page. |
| BUG-15 | events | The Events calendar is built from the previous visit's localStorage cache; freshly loaded events never appear. |
| BUG-RULES | rules | Any signed-in user can create their own member doc in a private circle (known gap; needs a callable function for invitations). |
