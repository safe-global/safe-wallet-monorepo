import type { CustomProjectConfig } from 'lost-pixel'

export const config: CustomProjectConfig = {
  storybookShots: {
    storybookUrl: './storybook-static',
  },

  // Platform mode
  lostPixelProjectId: process.env.LOST_PIXEL_PROJECT_ID,
  apiKey: process.env.LOST_PIXEL_API_KEY,

  // Comparison tuning
  threshold: 0.01,
  waitBeforeScreenshot: 2000,
  shotConcurrency: 5,
  browser: 'chromium',
}
