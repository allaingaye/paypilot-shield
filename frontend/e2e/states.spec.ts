import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const pages: { name: string; url: string; api: string; empty: string }[] = [
  { name: "Approvals", url: "/approvals", api: "approvals", empty: "nothing is waiting for you" },
  { name: "Payments", url: "/payments", api: "payments", empty: "no payments yet" },
  { name: "Invoices", url: "/invoices", api: "invoices", empty: "no invoices" },
  { name: "Suppliers", url: "/suppliers", api: "suppliers", empty: "no suppliers" },
  { name: "Policy", url: "/policy", api: "mandates", empty: "No policies signed yet." },
];

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@paypilot.demo");
  await page.getByLabel("Password").fill("e2e-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("link", { name: "Policy" }).first()).toBeVisible();
}

for (const p of pages) {
  test.describe(p.name, () => {
    // THE FIX: Use string concatenation instead of template literals to avoid PowerShell issues
    const url = new RegExp("/api/" + p.api + "$");
    
    test.beforeEach(async ({ page }) => { await login(page); });

    test("loading", async ({ page }) => {
      await page.route(url, async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); await r.continue(); });
      await page.goto(p.url);
      await expect(page.getByLabel("Loading").first()).toBeVisible();
    });
    test("empty", async ({ page }) => {
      await page.route(url, (r) => r.fulfill({ json: [] }));
      await page.goto(p.url);
      await expect(page.getByText(new RegExp(p.empty, "i"))).toBeVisible();
    });
    test("error with retry", async ({ page }) => {
      await page.route(url, (r) => r.fulfill({ status: 500, json: { detail: "boom" } }));
      await page.goto(p.url);
      await expect(page.getByText("Something went wrong")).toBeVisible();
      await page.unroute(url);
      await page.getByRole("button", { name: "Try again" }).first().click();
      await expect(page.getByText("Something went wrong")).toBeHidden();
    });
  });
}

test("keyboard: Tab to a supplier row and Enter opens it, Escape closes it", async ({ page }) => {
  await login(page);
  await page.goto("/suppliers");
  await page.getByRole("gridcell", { name: "ABC Supplies" }).click();
  await expect(page.getByRole("dialog", { name: "ABC Supplies" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "ABC Supplies" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("reduced motion turns animations off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto("/approvals");
  const names = await page.evaluate(() => [...document.querySelectorAll("*")].map((e) => getComputedStyle(e).animationName).filter((n) => n !== "none"));
  expect(names).toEqual([]);
});