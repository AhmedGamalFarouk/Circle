import { test, expect, login } from "../support/fixtures.js";
import { createUser, uniqueName, getDoc, adminAuth } from "../support/emulator.js";

test.describe("registration", () => {
  async function fillRegistration(page, { username, email, password }) {
    await page.goto("/register");
    await page.locator("#username").fill(username);
    await page.locator("#age").fill("1995-05-05");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);
    const city = page.getByRole("combobox").first();
    await city.fill("Cairo");
    await city.press("Enter");
    await page.getByRole("button", { name: "Football" }).click();
  }

  test("a new visitor can create an account", async ({ page }) => {
    const username = uniqueName("new");
    const email = `${username}@example.com`;
    await fillRegistration(page, { username, email, password: "Passw0rd!" });

    // Signed-out visitors can't read profiles, so the live check must not
    // report the name as taken; availability is checked after sign-up.
    await page.waitForTimeout(800);
    await expect(page.getByText(/already taken|Error checking/i)).toHaveCount(0);

    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL("/");

    const account = await adminAuth.getUserByEmail(email);
    const profile = await getDoc(`users/${account.uid}`);
    expect(profile).toMatchObject({ username, email, location: expect.any(String) });
  });

  test("rejects mismatched passwords and under-age users", async ({ page }) => {
    const username = uniqueName("bad");
    await fillRegistration(page, { username, email: `${username}@example.com`, password: "Passw0rd!" });
    await page.locator("#confirmPassword").fill("different");
    await page.locator("#age").fill(new Date().toISOString().slice(0, 10));
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page.getByText(/at least 18/).first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("a taken username is rejected and no account is left behind", async ({ page }) => {
    const existing = await createUser();
    const email = `${uniqueName("dupname")}@example.com`;
    await fillRegistration(page, { username: existing.username, email, password: "Passw0rd!" });
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/already taken/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
    await expect(adminAuth.getUserByEmail(email)).rejects.toMatchObject({ code: "auth/user-not-found" });
  });

  test("an email that is already registered shows an inline error", async ({ page }) => {
    const existing = await createUser();
    const username = uniqueName("dup");
    await fillRegistration(page, { username, email: existing.email, password: "Passw0rd!" });
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/already in use/i)).toBeVisible();
  });
});

test.describe("login", () => {
  test("signs in with valid credentials and lands on home", async ({ page }) => {
    const user = await createUser();
    await login(page, user);
    await expect(page).toHaveURL("/");
  });

  test("honours the redirect parameter", async ({ page }) => {
    const user = await createUser();
    await page.goto("/login?redirect=%2Fabout");
    await page.getByPlaceholder("Email address").fill(user.email);
    await page.getByPlaceholder("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("Skip Authentication signs in as the demo account", async ({ page }) => {
    // Matches VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD in .env.e2e.
    const email = "demo@example.com";
    const existing = await adminAuth.getUserByEmail(email).catch(() => null);
    const uid = existing
      ? existing.uid
      : (await createUser({ email, password: "DemoPassw0rd!", username: uniqueName("demo") })).uid;
    const { username } = await getDoc(`users/${uid}`);
    await page.goto("/login");
    await page.getByRole("button", { name: "Skip Authentication" }).click();
    await expect(page).toHaveURL("/");
    // Your own profile has no Connect button.
    await page.goto(`/profile/${uid}`);
    await expect(page.getByText(`@${username}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect", exact: true })).toHaveCount(0);
  });

  test("wrong password shows an error and stays on login", async ({ page }) => {
    const user = await createUser();
    await page.goto("/login");
    await page.getByPlaceholder("Email address").fill(user.email);
    await page.getByPlaceholder("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.locator(".Toastify__toast--error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty form shows validation messages", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("form")).toContainText(/required|enter/i);
  });

  test("a blocked user is shown the blocked dialog", async ({ page }) => {
    const user = await createUser({ profile: { isBlocked: true } });
    await page.goto("/login");
    await page.getByPlaceholder("Email address").fill(user.email);
    await page.getByPlaceholder("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.getByText(/blocked/i).first()).toBeVisible();
  });
});
