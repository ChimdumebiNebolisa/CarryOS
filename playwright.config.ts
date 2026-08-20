import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --hostname localhost --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /browser-smoke\.spec\.ts/ },
    { name: 'chromium-smoke', use: { ...devices['Desktop Chrome'] }, testMatch: /browser-smoke\.spec\.ts/ },
    { name: 'firefox-smoke', use: { ...devices['Desktop Firefox'] }, testMatch: /browser-smoke\.spec\.ts/ },
    { name: 'webkit-smoke', use: { ...devices['Desktop Safari'] }, testMatch: /browser-smoke\.spec\.ts/ },
  ],
})
