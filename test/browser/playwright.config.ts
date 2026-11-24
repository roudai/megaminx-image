import { defineConfig, devices } from '@playwright/test';

// ブラウザ 3 種で、Node.js と同じ SVG になるかを確かめる（SC-006）。
// dist/ は webServer で配る（リポジトリのルートを配る小さなサーバー）。
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  webServer: {
    command: 'node test/browser/serve.mjs',
    cwd: '../..',
    url: 'http://127.0.0.1:4178/package.json',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://127.0.0.1:4178' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
