import { test, expect, login, knownBug } from "../support/fixtures.js";
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
    knownBug("BUG-02", "the username check queries users while signed out; the new rules deny it and every username reads as taken, so nobody can register");
    const username = uniqueName("new");
    const email = `${username}@example.com`;
    await fillRegistration(page, { username, email, password: "Passw0rd!" });

    // The live availability check must accept a fresh username.
    await expect(page.getByText("Username is available!")).toBeVisible();

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

  test("an email that is already registered shows an inline error", async ({ page }) => {
    knownBug("BUG-02", "blocked by the same username check before the email is ever tried");
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
    knownBug("BUG-04", "the login page's onAuthStateChanged listener navigates to / and overrides ?redirect=");
    const user = await createUser();
    await page.goto("/login?redirect=%2Fabout");
    await page.getByPlaceholder("Email address").fill(user.email);
    await page.getByPlaceholder("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/about$/);
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

  test("login page offers no shared-account shortcut", async ({ page }) => {
    knownBug("BUG-01", "\"Skip Authentication\" signs any visitor into a hard-coded real account whose password is in the source");
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /skip authentication/i })).toHaveCount(0);
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
