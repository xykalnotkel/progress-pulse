import { expect, test } from "@playwright/test";

test("home renders the brand, navigation, and structured data", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/XySpace Blog/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Small steps");
  const structuredData = await page.locator('script[type="application/ld+json"]').evaluate((node) => node.textContent);
  expect(structuredData).toContain("WebSite");
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute("href", /\/feed\.xml$/);
});

test("updates can be searched and filtered", async ({ page }) => {
  await page.goto("/updates");
  const posts = page.locator(".update-post");
  await expect(posts).toHaveCount(3);
  await page.getByLabel("Cari update").fill("cockpit");
  await expect(posts).toHaveCount(1);
  await page.getByLabel("Cari update").fill("");
  await page.getByRole("button", { name: "Testing" }).click();
  await expect(posts).toHaveCount(1);
});

test("detail is canonical, private, and directly interactive", async ({ page }) => {
  await page.goto("/updates/update-01");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/updates\/update-01$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.getByRole("heading", { name: "Tulis komentar" })).toBeVisible();
  await expect(page.locator(".thread-bubble")).toHaveCount(2);
  await expect(page.locator(".reply-plus")).toHaveCount(1);
  expect(await page.content()).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
});

test("home profile card opens the public owner profile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".floating-profile-card")).toBeVisible();
  await page.locator(".floating-profile-card").click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("RSS endpoint returns a valid channel", async ({ request }) => {
  const response = await request.get("/feed.xml");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const body = await response.text();
  expect(body).toContain("<rss version=\"2.0\"");
  expect(body).toContain("<item>");
});

test("mobile navigation remains reachable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "mobile-only assertion");
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Buka navigasi" });
  await menu.click();
  await expect(page.locator(".nav-links-open")).toBeVisible();
  await expect(page.locator(".nav-links-open").getByRole("link", { name: "Updates" })).toBeVisible();
});
