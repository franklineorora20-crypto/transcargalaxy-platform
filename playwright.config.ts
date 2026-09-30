import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/phase4-e2e.spec.ts'],
  timeout: 60000,
});
