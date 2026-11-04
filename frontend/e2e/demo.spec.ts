import { expect, test } from "@playwright/test";

test("sign policy, verify a supplier, then pay, approve and block", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@paypilot.demo");
  await page.getByLabel("Password").fill("e2e-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /AI Payment Agent/i }).first()).toBeVisible();

  expect(await page.evaluate(() => document.cookie)).toBe("");
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain("eyJ");

  await page.getByRole("link", { name: "Policy" }).first().click();
  await page.getByRole("button", { name: "Review and sign" }).click();
  await page.getByRole("button", { name: "Sign policy" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
  await page.getByText("Close", { exact: true }).click();

  await page.getByRole("link", { name: "Suppliers" }).first().click();
  await page.getByRole("gridcell", { name: "Unknown Supplier" }).click();
  await page.getByRole("button", { name: "Verify Supplier" }).click();
  await page.getByRole("button", { name: "Sign and verify" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
  await page.getByText("Close", { exact: true }).click();
  
  await expect(page.getByText(/Verified by owner@paypilot.demo with a signature/)).toBeVisible();
  await page.getByRole("dialog", { name: "Unknown Supplier" }).getByRole("button", { name: "Close" }).click();

  await page.getByRole("link", { name: "AI Agent" }).first().click();
  
  const ask = async (msg: string, badge: string) => {
    const input = page.getByPlaceholder("Ask the agent to pay an invoice...");
    await input.fill(msg);
    await input.press("Enter"); 
    await expect(page.getByText(badge, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  };
  
  await ask("Pay INV-001", "Auto-pay");
  await ask("Pay INV-003", "Needs approval");
  await ask("Pay INV-005", "Blocked");

  await page.getByRole("link", { name: "Approvals" }).first().click();
  await page.getByRole("button", { name: "Review and sign" }).click();
  await page.getByRole("button", { name: "Sign and approve" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
});
