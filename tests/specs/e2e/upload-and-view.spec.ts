import { test, expect } from '@playwright/test';
import * as path from 'path';
import { registerViaUi } from '@support/ui';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures/manual-testing');

/** R8/R9: upload a PDF through the real UI (drag-and-drop isn't simulated here - a native OS
 *  file chooser is - and open it in the viewer). */
test('upload a PDF and open it in the viewer', async ({ page }) => {
  await registerViaUi(page, 'e2e-upload');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload' }).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(FIXTURES_DIR, 'simple-invoice.pdf'));

  await expect(page.getByText('Uploads complete')).toBeVisible({ timeout: 15_000 });
  const row = page.getByRole('row', { name: /simple-invoice\.pdf/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText('KB');

  await row.click();
  await page.waitForURL(/\/file\//);
  await expect(page.getByRole('main')).toContainText('simple-invoice.pdf');
  await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();

  await page.getByRole('link', { name: 'Close' }).click();
  await expect(row).toBeVisible();
});

/** R8 rejection path: a non-PDF is rejected by the client before it ever reaches the API. */
test('a non-PDF file is rejected on upload', async ({ page }) => {
  await registerViaUi(page, 'e2e-reject');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload' }).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(FIXTURES_DIR, 'not-a-pdf.txt'));

  await expect(page.getByText(/is not a PDF/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('This folder is empty')).toBeVisible();
});
