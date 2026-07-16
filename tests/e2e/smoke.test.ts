import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads and shows title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Prayer Wall/);
  });

  test("prayers page loads and shows list", async ({ page }) => {
    await page.goto("/prayers");
    await expect(page.locator("h1")).toContainText("Prayer");
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/Log in/);
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page).toHaveTitle(/Register/);
  });

  test("RSS feed returns XML", async ({ page }) => {
    const response = await page.goto("/rss.xml");
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.ok()).toBeTruthy();
  });

  test("sitemap returns XML", async ({ page }) => {
    const response = await page.goto("/sitemap-index.xml");
    expect(response?.ok()).toBeTruthy();
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("manifest.json is valid", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.ok()).toBeTruthy();
    const manifest = await response?.json();
    expect(manifest?.name).toBe("Prayer Wall");
  });

  test("404 page returns 404 status", async ({ page }) => {
    const response = await page.goto("/nonexistent");
    expect(response?.status()).toBe(404);
  });
});
