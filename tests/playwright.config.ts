import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_URL = process.env.API_URL ?? 'https://virtual-data-room-production.up.railway.app';
const WEB_URL = process.env.WEB_URL ?? 'https://virtual-data-room-ten.vercel.app';
// HEADLESS=false lets you watch the E2E browser while iterating locally.
const HEADLESS = process.env.HEADLESS !== 'false';

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'api',
      testDir: './specs/api',
      use: {
        baseURL: API_URL,
      },
    },
    {
      name: 'e2e',
      testDir: './specs/e2e',
      use: {
        baseURL: WEB_URL,
        ...devices['Desktop Chrome'],
        headless: HEADLESS,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
    },
  ],
});
