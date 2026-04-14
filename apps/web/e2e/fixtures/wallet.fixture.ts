import { type Page } from '@playwright/test'
import { test as baseTest } from './base.fixture'

/**
 * Wallet fixture — connects a signer via the Private Key module in Web3 Onboard.
 *
 * Ported from cypress/support/utils/wallet.js.
 *
 * Key differences from Cypress:
 * - Uses Playwright's CSS piercing (>>) to reach into onboard-v2 shadow DOM
 * - Uses page.fill() which dispatches proper input events (no jQuery .val())
 * - Explicit retry loop instead of Cypress implicit retries
 */

export type WalletCredentials = {
  OWNER_1_PRIVATE_KEY: string
  OWNER_1_WALLET_ADDRESS: string
  OWNER_2_PRIVATE_KEY: string
  OWNER_2_WALLET_ADDRESS: string
  OWNER_3_PRIVATE_KEY: string
  OWNER_3_WALLET_ADDRESS: string
  OWNER_4_PRIVATE_KEY: string
  OWNER_4_WALLET_ADDRESS: string
}

function getWalletCredentials(): WalletCredentials {
  const raw = process.env.CYPRESS_WALLET_CREDENTIALS || process.env.WALLET_CREDENTIALS || '{}'
  return JSON.parse(raw)
}

/**
 * Connect a wallet signer via the Private Key module.
 *
 * Shadow DOM strategy:
 * 1. Primary: CSS piercing with `>>` to reach onboard-v2 internals
 * 2. Fallback: Explicit shadowRoot traversal via evaluate()
 *
 * @param page - Playwright Page instance
 * @param privateKey - Private key string to inject
 */
export async function connectSigner(page: Page, privateKey: string): Promise<void> {
  const maxRetries = 20
  const pkInputSelector = '[data-testid="private-key-input"] input'
  const pkConnectBtnSelector = '[data-testid="pk-connect-btn"]'
  const connectWalletBtnSelector = '[data-testid="connect-wallet-btn"]'

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Check if private key input is already visible (from a previous step or retry)
    const pkInput = page.locator(pkInputSelector)
    if (await pkInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await pkInput.fill(privateKey)
      await page.locator(pkConnectBtnSelector).click()
      await page.waitForTimeout(2000)
      await dismissOutreachPopup(page)
      return
    }

    // Check if "Connect wallet" button is visible
    const connectBtn = page.locator(connectWalletBtnSelector).first()
    if (await connectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await connectBtn.click({ force: true })
      await page.waitForTimeout(2000)

      // Try to find "Private key" button inside onboard-v2 shadow DOM
      const onboardPresent = await page
        .locator('onboard-v2')
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (onboardPresent) {
        // Approach 1: CSS piercing through shadow DOM
        const privateKeyBtn = page.locator('onboard-v2 >> button:has-text("Private key")')
        if (await privateKeyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await privateKeyBtn.click()
          await page.waitForTimeout(1000)

          // Now fill the private key input
          const input = page.locator(pkInputSelector)
          if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
            await input.fill(privateKey)
            await page.locator(pkConnectBtnSelector).click()
            await page.waitForTimeout(2000)
            await dismissOutreachPopup(page)
            return
          }
        }

        // Approach 2: Explicit shadow root traversal (fallback)
        const clicked = await page.evaluate(() => {
          const onboard = document.querySelector('onboard-v2')
          if (!onboard?.shadowRoot) return false
          const buttons = onboard.shadowRoot.querySelectorAll('button')
          for (const btn of buttons) {
            if (btn.textContent?.includes('Private key')) {
              btn.click()
              return true
            }
          }
          return false
        })

        if (clicked) {
          await page.waitForTimeout(1000)
          const input = page.locator(pkInputSelector)
          if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
            await input.fill(privateKey)
            await page.locator(pkConnectBtnSelector).click()
            await page.waitForTimeout(2000)
            await dismissOutreachPopup(page)
            return
          }
        }
      }
    }

    // Wait before retrying
    await page.waitForTimeout(1000)
  }

  throw new Error(`Failed to connect wallet signer after ${maxRetries} attempts`)
}

/**
 * Dismiss the outreach popup if it appears after wallet connection.
 * Mirrors main.closeOutreachPopup() from Cypress.
 */
async function dismissOutreachPopup(page: Page): Promise<void> {
  const closeBtn = page.locator('button[aria-label="close outreach popup"]')
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
  }
}

// ── Extended test fixture with wallet ──────────────────────────────────────────

export type WalletFixtures = {
  /** Wallet credentials parsed from environment */
  walletCredentials: WalletCredentials
}

export const test = baseTest.extend<WalletFixtures>({
  walletCredentials: async ({}, use) => {
    await use(getWalletCredentials())
  },
})

export { expect } from '@playwright/test'
