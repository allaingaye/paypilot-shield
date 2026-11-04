import { expect, test } from "@playwright/test";

// The demo flow from the README, through the real UI, fake PayPal. Guards the money path in one run.
test("sign policy, verify a supplier, then pay, approve and block", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@paypilot.demo");
  await page.getByLabel("Password").fill("e2e-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /AI Payment Agent/i }).first()).toBeVisible();

  // the login token is an httpOnly cookie: scripts and storage must not see it
  expect(await page.evaluate(() => document.cookie)).toBe("");
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain("eyJ");

  // sign the policy
  await page.getByRole("link", { name: "Policy" }).first().click();
  await page.getByRole("button", { name: "Review and sign" }).click();
  await page.getByRole("button", { name: "Sign policy" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // verify the unverified supplier with a signature
  await page.getByRole("link", { name: "Suppliers" }).first().click();
  await page.getByRole("gridcell", { name: "Unknown Supplier" }).click();
  await page.getByRole("button", { name: "Verify Supplier" }).click();
  await page.getByRole("button", { name: "Sign and verify" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  
  await expect(page.getByText(/Verified by owner@paypilot.demo with a signature/)).toBeVisible();
  await page.getByRole("dialog", { name: "Unknown Supplier" }).getByRole("button", { name: "Close" }).click();

  // the three outcomes
  await page.getByRole("link", { name: "AI Agent" }).first().click();
  const ask = async (msg: string, badge: string) => {
    await page.getByPlaceholder("Ask the agent to pay an invoice...").fill(msg);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(badge, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  };
  
  await ask("Pay INV-001", "Auto pay");
  await ask("Pay INV-003", "Needs approval");
  await ask("Pay INV-005", "Blocked");

  // approve INV-003 with a signature
  await page.getByRole("link", { name: "Approvals" }).first().click();
  await page.getByRole("button", { name: "Review and sign" }).click();
  await page.getByRole("button", { name: "Sign and approve" }).click();
  await expect(page.getByText("Payment Authorized")).toBeVisible();
});