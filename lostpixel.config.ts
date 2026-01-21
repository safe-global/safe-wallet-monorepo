import type { CustomProjectConfig } from 'lost-pixel'

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [{ path: '/home?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: 'home' }],
    baseUrl: process.env.LOST_PIXEL_BASE_URL || 'http://localhost:3000',
  },
  waitBeforeScreenshot: 5000,
  waitForFirstRequest: 30000,
  lostPixelProjectId: 'cmko350qc0l0oeja7dzdscyfu',
  apiKey: process.env.LOST_PIXEL_API_KEY,
}
