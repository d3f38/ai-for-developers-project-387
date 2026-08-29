import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * По умолчанию тесты поднимают приложение локально (собранный фронтенд +
 * бэкенд). Чтобы прогнать те же тесты против Docker-образа или задеплоенного
 * стенда, передайте готовый адрес: `E2E_BASE_URL=https://... npm run test:e2e`.
 */
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    // Слоты и даты форматируются на клиенте, поэтому фиксируем зону и локаль,
    // иначе ожидаемые подписи времени зависят от машины, где идёт прогон.
    timezoneId: "UTC",
    locale: "en-US",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm run e2e:server",
        url: `http://127.0.0.1:${PORT}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          PORT: String(PORT),
          // Слоты нарезаются от локальной полуночи сервера — держим его
          // в той же зоне, что и браузер в тестах.
          TZ: "UTC",
          STATIC_DIR: "frontend/dist",
        },
        stdout: "pipe",
        stderr: "pipe",
      },
});
