import { test, expect, Browser } from '@playwright/test';
import { registerViaUi } from '@support/ui';

/**
 * R13/R15/R16: the single highest-value UI journey per the test plan's risk priorities -
 * share a room with a second user, confirm it's read-only for them, then revoke and confirm
 * access is actually gone, not just hidden. Two independent browser contexts stand in for
 * owner and viewer, each with their own session.
 */
async function withSecondContext(browser: Browser, fn: (page: Awaited<ReturnType<Browser['newPage']>>) => Promise<void>) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

test('sharing a room grants read-only access, and revoking it removes access immediately', async ({ page, browser }) => {
  await registerViaUi(page, 'e2e-share-owner');

  await withSecondContext(browser, async (viewerPage) => {
    const viewer = await registerViaUi(viewerPage, 'e2e-share-viewer');

    await page.getByRole('button', { name: 'Share' }).first().click();
    await page.getByRole('textbox', { name: 'Email' }).fill(viewer.email);
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await expect(page.getByText(viewer.email, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Revoke' })).toBeVisible();

    await viewerPage.goto('/shared-with-me');
    const sharedLink = viewerPage.getByRole('link', { name: /My Data Room/ });
    await expect(sharedLink).toBeVisible();
    await sharedLink.click();
    await viewerPage.waitForURL(/\/shared-with-me\/room\//);

    // Read-only: none of the owner-only controls are present for the viewer.
    await expect(viewerPage.getByRole('button', { name: 'Upload' })).toHaveCount(0);
    await expect(viewerPage.getByRole('button', { name: 'New folder' })).toHaveCount(0);
    await expect(viewerPage.getByRole('button', { name: 'Share' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Revoke' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await viewerPage.reload();
    await expect(viewerPage.getByText(/does not exist, or you don.t have access/i)).toBeVisible();
  });
});
