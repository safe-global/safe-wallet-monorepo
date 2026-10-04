/**
 * Fixtures for the live step-up suite: the signed-in email user's page, the Auth0 challenge, a recorder for gated
 * calls, and the Workspace this run works in. `STEP_UP_FEATURE_FLAGS` (JSON) seeds the app's feature-flag overrides,
 * e.g. `{"SAFE_PRO_PLANS_V2":true}` to run the billing specs against a flag-gated variant.
 */
import type { Page } from '@playwright/test'
import { test as base, expect, seedLocalStorage } from './test.fixture'
import { seedConnectedWallet } from './seed-wallet'
import { WalletPage } from '../pages/wallet.page'
import { getStepUpCredentials, type StepUpCredentials } from '../data/step-up-credentials'
import { LS_NAMESPACE } from '../data/constants'
import { OIDC_STORAGE_STATE } from '../data/step-up-paths'
import { Auth0Page } from '../pages/auth0-challenge.page'
import { readRunState, recordStepUpTraffic, waitForWindowToLapse, type RunState } from './step-up'

type StepUpFixtures = {
  creds: StepUpCredentials
  auth0: Auth0Page
  traffic: ReturnType<typeof recordStepUpTraffic>
  /** Waits until the last second factor no longer counts, so the next gated call needs a step-up. */
  lapse: () => Promise<void>
  /** Passes the Auth0 challenge the app just redirected to and waits to be back on the app. */
  stepUp: () => Promise<void>
  workspace: RunState
  /** Opens a separate, recorded browser signed in with Ethereum as the wallet with this private key. */
  walletSession: (privateKey: string) => Promise<Page>
}

const featureFlags = process.env.STEP_UP_FEATURE_FLAGS

export const test = base.extend<StepUpFixtures>({
  safePage: async ({ safePage }, use, testInfo) => {
    await safePage.addInitScript(
      ({ ns, flags }) => {
        // A saved session can carry a wallet without its key, which opens a blocking "Connect with Private Key" dialog.
        window.localStorage.removeItem(`${ns}lastWallet`)
        if (flags) window.localStorage.setItem(`${ns}featureFlagOverrides`, flags)
      },
      { ns: LS_NAMESPACE, flags: featureFlags ?? '' },
    )
    // CloudFront can serve the previous deploy's HTML for a while; a unique query string always reaches the origin.
    await safePage.context().route(
      (url) => url.origin === new URL(testInfo.project.use.baseURL ?? '').origin && !url.pathname.startsWith('/_next'),
      (route) => {
        if (route.request().resourceType() !== 'document') return route.continue()
        const url = new URL(route.request().url())
        url.searchParams.set('_cb', String(Date.now()))
        return route.continue({ url: url.toString() })
      },
    )
    await use(safePage)
    // Auth0 rotates its session cookie on every challenge; the next test must start from the rotated one.
    if (testInfo.project.name === 'flows') await safePage.context().storageState({ path: OIDC_STORAGE_STATE })
  },
  creds: async ({}, use) => {
    await use(getStepUpCredentials())
  },
  auth0: async ({ safePage }, use) => {
    await use(new Auth0Page(safePage))
  },
  traffic: async ({ safePage }, use) => {
    const traffic = recordStepUpTraffic(safePage)
    await use(traffic)
    traffic.stop()
  },
  lapse: async ({ safePage }, use) => {
    await use(() => waitForWindowToLapse(safePage))
  },
  stepUp: async ({ auth0, creds }, use) => {
    await use(() => auth0.completeWithAuthenticator(creds.totpSecret))
  },
  walletSession: async ({ browser }, use, testInfo) => {
    const pages: Page[] = []
    await use(async (privateKey) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: 1400, height: 900 },
        recordVideo: { dir: testInfo.outputPath(`wallet-${pages.length + 1}`), size: { width: 1400, height: 900 } },
      })
      const page = await context.newPage()
      pages.push(page)
      await seedLocalStorage(page)
      await seedConnectedWallet(page, privateKey)
      const wallet = new WalletPage(page)
      await page.goto('/welcome/spaces')
      await wallet.accountCenter.waitFor({ timeout: 60_000 })
      if (await wallet.siweContinueBtn.isVisible().catch(() => false)) await wallet.signInWithEthereum()
      return page
    })
    for (const [index, page] of pages.entries()) {
      const video = page.video()
      await page.context().close()
      if (video)
        await testInfo.attach(`wallet ${index + 1} video`, { path: await video.path(), contentType: 'video/webm' })
    }
  },
  workspace: async ({ creds }, use) => {
    const run = readRunState()
    const spaceId = creds.spaceId ?? run?.spaceId
    test.skip(!spaceId, 'No Workspace yet: run the onboarding spec first or set STEP_UP_SPACE_ID.')
    await use({ spaceId: spaceId as string, spaceName: run?.spaceName ?? '' })
  },
})

export { expect }
