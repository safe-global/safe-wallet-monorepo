/**
 * Navigation utilities with Safe Wallet-specific retry logic.
 *
 * Safe Client Gateway staging can return 429 (rate limited) during
 * high-load periods. This helper retries navigation with backoff
 * instead of failing the test immediately.
 */
import { type Page, type Response } from '@playwright/test'

const MAX_RETRIES = 2
const BACKOFF_MS = 6_000

/**
 * Navigate to a URL with automatic retry on 429 (Too Many Requests).
 *
 * Uses waitUntil: 'commit' because Safe Wallet keeps WebSocket connections
 * open indefinitely — 'load' (the default) never resolves.
 *
 * @param page - Playwright page instance
 * @param url - URL path to navigate to (e.g., '/home?safe=sep:0x...')
 * @returns The navigation response
 */
export async function safeGoto(page: Page, url: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await page.goto(url, { waitUntil: 'commit' })

    if (response && response.status() === 429 && attempt < MAX_RETRIES) {
      // Rate limited — wait and retry
      await page.waitForTimeout(BACKOFF_MS) // Intentional: backoff delay, not a UI wait
      continue
    }

    return response
  }

  return null
}
