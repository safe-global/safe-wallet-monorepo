/**
 * One-shot clickthrough — Security Hub "Update" CTA for an outdated contract
 * version navigates to Settings → Setup (the mastercopy upgrade page), not the
 * modules page.
 *
 * Flow: SiWE sign-in on the Spaces landing → create a throwaway space via the
 * CGW API (same session cookie the app uses) → track a mainnet Safe stuck on
 * contract v1.1.1 → open the Security Hub → open the Safe's security report →
 * expand "Contract version is outdated" → click "Update →" → assert we land on
 * /settings/setup, where the ContractVersion upgrade widget lives.
 *
 * Data: the tracked Safe (SAFES.ETH_OUTDATED_SAFE_111) is read-only — the test
 * never transacts; it only adds it to its own throwaway space as a tracked
 * account. The space is created per-run with a unique name and deleted in a
 * `finally` block, so parallel runs never share state.
 *
 * Env requirements: the target deployment must have the SPACES and
 * SECURITY_HUB chain features enabled (true on dev / PR previews) and
 * CYPRESS_WALLET_CREDENTIALS set (CI passes it automatically).
 *
 * Tag: @one-shot — runs only under the "one-shots" Playwright project.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { CHAIN_IDS, SAFES } from '../../src/data/constants'

const OUTDATED_SAFE_ADDRESS = SAFES.ETH_OUTDATED_SAFE_111.split(':')[1]

test.describe('Security Hub — outdated contract version CTA', { tag: '@one-shot' }, () => {
  test('should navigate to Settings → Setup when clicking Update on the outdated contract version check', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // --- 1. Sign in to Spaces: connect the PK wallet, then SiWE.
    await safePage.goto('/welcome/spaces')
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    // Capture the CGW origin from the SiWE verify call so the API setup below
    // talks to the same gateway (and session cookie) the app under test uses.
    const verifyResponse = safePage.waitForResponse(
      (r) => /\/v1\/auth\/verify/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
    )
    await walletPage.signInWithEthereum()
    const cgwOrigin = new URL((await verifyResponse).url()).origin

    /** Authenticated CGW call from the page context (reuses the SiWE cookie). */
    const cgwFetch = (path: string, method: 'POST' | 'DELETE', body?: unknown): Promise<unknown> =>
      safePage.evaluate(
        async ({ url, method, body }) => {
          const res = await fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
          })
          if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${await res.text()}`)
          return res.json().catch(() => null)
        },
        { url: `${cgwOrigin}${path}`, method, body },
      )

    // --- 2. Setup via API (not UI clicks): throwaway space + tracked outdated Safe.
    const space = (await cgwFetch('/v1/spaces/create-with-user', 'POST', {
      name: `one-shot security hub ${Date.now()}`,
    })) as { uuid: string }

    try {
      await cgwFetch(`/v1/spaces/${space.uuid}/safes`, 'POST', {
        safes: [{ chainId: CHAIN_IDS.ethereum, address: OUTDATED_SAFE_ADDRESS }],
      })

      // --- 3. Open the Security Hub and the Safe's security report.
      await safePage.goto(`/spaces/security?spaceId=${space.uuid}`)
      const safeRow = safePage.getByTestId('security-safe-row')
      await expect(safeRow).toBeVisible()
      await safeRow.click()
      const drawer = safePage.getByRole('dialog', { name: 'Security report' })
      await expect(drawer).toBeVisible()

      // --- 4. The scan flags the outdated mastercopy (on-chain reads — allow time).
      const outdatedCheck = drawer.getByText('Contract version is outdated')
      await expect(outdatedCheck).toBeVisible({ timeout: 60_000 })
      await outdatedCheck.click()

      // --- 5. "Update →" must lead to Settings → Setup, where the contract
      // version (mastercopy) upgrade is initiated — NOT the modules page.
      await drawer.getByRole('link', { name: 'Update' }).click()
      await expect(safePage).toHaveURL(/\/settings\/setup\?safe=/)
      await expect(safePage.getByRole('heading', { name: 'Contract version' })).toBeVisible()
    } finally {
      // --- 6. Cleanup: remove the throwaway space (cascades its tracked Safes).
      await cgwFetch(`/v1/spaces/${space.uuid}`, 'DELETE').catch(() => null)
    }
  })
})
