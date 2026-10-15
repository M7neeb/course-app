import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (vite preview), on desktop Chromium and on
// WebKit with an iPhone 15 profile — WebKit is Safari's engine, the closest we get to the phone.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:4173/',
    // The PWA service worker would cache the app shell between runs; tests always want the fresh build.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'] } }
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    // Never reuse a server that is already running: it may be serving an older build.
    reuseExistingServer: false,
    timeout: 120_000
  }
});
