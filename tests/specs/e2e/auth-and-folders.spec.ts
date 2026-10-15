import { test, expect } from '@playwright/test';
import { registerViaUi } from '@support/ui';
import { testName } from '@support/ids';

/** R1/R4/R5: the core "sign up, organize a data room" journey, plus the session edge case from manual-test-log.md. */
test('register, create a nested folder, sign out, and confirm private data isn\'t visible after sign-out', async ({ page }) => {
  const user = await registerViaUi(page, 'e2e-auth');

  const folderName = testName('e2e-folder');
  await page.getByRole('button', { name: 'New folder' }).first().click();
  await page.getByRole('textbox', { name: 'Folder name' }).fill(folderName);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('row', { name: new RegExp(folderName) })).toBeVisible();

  // Nest a folder inside it (R4).
  await page.getByRole('row', { name: new RegExp(folderName) }).click();
  await page.waitForURL(/\/folder\//);
  const nestedName = testName('e2e-nested');
  await page.getByRole('button', { name: 'New folder' }).first().click();
  await page.getByRole('textbox', { name: 'Folder name' }).fill(nestedName);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('row', { name: new RegExp(nestedName) })).toBeVisible();

  // Breadcrumb reflects the nested path (R5).
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(folderName);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('/login');

  // Signed out: the data room URL we were just on must not show private data (manual-test-log R1).
  await page.goBack();
  await expect(page).toHaveURL('/login');

  // Log back in with the same account.
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
  await expect(page.getByText(user.name)).toBeVisible();
});
