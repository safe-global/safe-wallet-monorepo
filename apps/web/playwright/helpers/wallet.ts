import { type Page, expect } from '@playwright/test'

// ── Selectors ────────────────────────────────────────────────────────────────

const onboardv2 = 'onboard-v2'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
const pkInput = '[data-testid="private-key-input"]'
const pkConnectBtn = '[data-testid="pk-connect-btn"]'
const accountCenter = '[data-testid="open-account-center"]'

const cookieAcceptBtnName = 'Accept all'
const privateKeyStr = 'Private key'

// ── Actions ──────────────────────────────────────────────────────────────────

export async function dismissCookieBanner(page: Page) {
  const btn = page.getByRole('button', { name: cookieAcceptBtnName })
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click()
    await expect(btn).not.toBeVisible()
  }
}

/**
 * Click the Connect button, then click the "Private key" button inside onboard-v2's
 * shadow DOM. Retries the flow end-to-end until the pk input modal appears.
 *
 * Why retry + combined action:
 * - The first Connect click sometimes fails silently (SDK bound late, race with
 *   onboard init), mirroring the retry loop in cypress/support/utils/wallet.js.
 * - Once the shadow root is populated, we click the button within the same
 *   page.evaluate() call — querying the shadow root then acting on it in separate
 *   evaluate() calls can fail because the onboard-v2 host re-renders between calls
 *   and detaches the shadow root reference.
 */
export async function openConnectWalletAndSelectPk(page: Page) {
  const connectBtn = page.locator(connectWalletBtn).first()
  await expect(connectBtn).toBeVisible({ timeout: 60_000 })

  const maxAttempts = 10
  const perAttemptTimeout = 3000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await connectBtn.click({ force: true })

    try {
      // Poll the shadow DOM in one call; when the button is found, click it immediately.
      // Returns true only after the click has fired, so the next step can proceed.
      await page.waitForFunction(
        (btnText) => {
          const el = document.querySelector('onboard-v2')
          const shadow = el?.shadowRoot
          if (!shadow) return false
          const buttons = shadow.querySelectorAll('button')
          for (const btn of buttons) {
            if (btn.textContent?.includes(btnText)) {
              btn.click()
              return true
            }
          }
          return false
        },
        privateKeyStr,
        { timeout: perAttemptTimeout },
      )
      return
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(`onboard-v2 "${privateKeyStr}" button not found after ${maxAttempts} attempts`)
      }
    }
  }
}

export async function enterPrivateKey(page: Page, privateKey: string) {
  const input = page.locator(pkInput).locator('input')
  await expect(input).toBeVisible({ timeout: 10_000 })
  await input.fill(privateKey)
  await page.locator(pkConnectBtn).click()
}

export async function waitForConnection(page: Page) {
  await expect(page.locator(accountCenter)).toBeVisible({ timeout: 30_000 })
}

// ── Composite flow ───────────────────────────────────────────────────────────

export async function connectSigner(page: Page, privateKey: string) {
  await dismissCookieBanner(page)
  await openConnectWalletAndSelectPk(page)
  await enterPrivateKey(page, privateKey)
  await waitForConnection(page)
}
