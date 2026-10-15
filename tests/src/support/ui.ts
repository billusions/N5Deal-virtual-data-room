import { Page } from '@playwright/test';
import { testEmail, TEST_USER_PASSWORD } from './ids';

export interface UiUser {
  name: string;
  email: string;
  password: string;
}

/** Registers a brand-new throwaway user through the real registration form and lands on the data room. */
export async function registerViaUi(page: Page, label: string): Promise<UiUser> {
  const user: UiUser = { name: `QA ${label}`, email: testEmail(label), password: TEST_USER_PASSWORD };

  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Full name' }).fill(user.name);
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(user.password);
  await page.getByRole('textbox', { name: 'Confirm password' }).fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('/');

  return user;
}
