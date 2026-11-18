import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL ?? 'http://localhost:3100'
const { port, pathname } = new URL(baseURL)
const servesSubfolder = pathname.replace(/\/$/, '') !== ''
const hostDir = process.env.HOST_DIR

if (servesSubfolder && !hostDir) {
  throw new Error('BASE_URL has a path: set HOST_DIR to the folder that contains the copied out/ under that path')
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: `yarn http-server ${servesSubfolder ? hostDir : 'out'} -p ${port} -c-1 -s`,
    url: baseURL,
    reuseExistingServer: true,
  },
})
