/**
 * Regression — a Safe that CGW bans shows fixed copy, neither the generic error nor the gateway's wording.
 *
 * CGW rejects a banned Safe with `451 { code, message }`. The screen must tell a ban apart
 * from a transient error, but the gateway's `message` (for example a provider's region block)
 * is not written for users, so the app shows its own copy. The jest tests cover the message
 * extraction and the component→hook wiring; this spec covers the one seam they can't:
 * a real 451 travelling from the network, through RTK Query, onto the rendered screen.
 *
 * A 451 cannot be produced by the real staging API, so safe-info is stubbed —
 * the error-state exception in docs/AI_TEST_OUTPUT_FORMAT.md step 6.
 *
 * Run: yarn workspace @safe-global/web pw:test safe-banned-legal-message
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import {
  SafeLoadingErrorPage,
  SAFE_UNAVAILABLE_MESSAGE,
  GENERIC_LOADING_ERROR,
} from '../../src/pages/safe-loading-error.page'

test.describe('Safe loading error — legal block', { tag: '@regression' }, () => {
  test("should show fixed copy instead of the gateway's wording when CGW bans the Safe with 451", async ({
    safePage,
    safes,
  }) => {
    const errorScreen = new SafeLoadingErrorPage(safePage)
    const gatewayWording = 'Blocked in your region by provider edge-node-7'
    await errorScreen.stubSafeInfo(451, { code: 451, message: gatewayWording })

    await errorScreen.goto(safes.SEP_STATIC_SAFE_2)

    await expect(errorScreen.container).toContainText(SAFE_UNAVAILABLE_MESSAGE)
    await expect(errorScreen.container).not.toContainText(gatewayWording)
    await expect(errorScreen.container).not.toContainText(GENERIC_LOADING_ERROR)
    await expect(errorScreen.mainPageButton).toBeVisible()
  })

  test('should keep the generic message when the Safe fails to load for another reason', async ({
    safePage,
    safes,
  }) => {
    const errorScreen = new SafeLoadingErrorPage(safePage)
    await errorScreen.stubSafeInfo(500, { code: 500, message: 'Internal server error' })

    await errorScreen.goto(safes.SEP_STATIC_SAFE_2)

    await expect(errorScreen.container).toContainText(GENERIC_LOADING_ERROR)
    // A raw backend string must never reach the screen for a non-451
    await expect(errorScreen.container).not.toContainText('Internal server error')
    await expect(errorScreen.mainPageButton).toBeVisible()
  })
})
