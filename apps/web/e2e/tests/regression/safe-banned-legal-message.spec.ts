/**
 * Regression — a Safe that CGW bans shows the backend's reason, not the generic copy.
 *
 * CGW rejects a banned Safe with `451 { code, message }`. Before this fix every
 * safe-info failure rendered the same "This Safe account couldn't be loaded", so a
 * ban was indistinguishable from a transient error. The jest tests cover the message
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
import { SAFES } from '../../src/data/constants'
import {
  SafeLoadingErrorPage,
  LEGAL_BLOCK_MESSAGE,
  GENERIC_LOADING_ERROR,
} from '../../src/pages/safe-loading-error.page'

test.describe('Safe loading error — legal block', { tag: '@regression' }, () => {
  test('should show the backend reason when CGW bans the Safe with 451', async ({ safePage }) => {
    const errorScreen = new SafeLoadingErrorPage(safePage)
    await errorScreen.stubSafeInfo(451, { code: 451, message: LEGAL_BLOCK_MESSAGE })

    await errorScreen.goto(SAFES.SEP_STATIC_SAFE_2)

    await expect(errorScreen.container).toContainText(LEGAL_BLOCK_MESSAGE)
    await expect(errorScreen.container).not.toContainText(GENERIC_LOADING_ERROR)
    await expect(errorScreen.mainPageButton).toBeVisible()
  })

  test('should keep the generic message when the Safe fails to load for another reason', async ({ safePage }) => {
    const errorScreen = new SafeLoadingErrorPage(safePage)
    await errorScreen.stubSafeInfo(500, { code: 500, message: 'Internal server error' })

    await errorScreen.goto(SAFES.SEP_STATIC_SAFE_2)

    await expect(errorScreen.container).toContainText(GENERIC_LOADING_ERROR)
    // A raw backend string must never reach the screen for a non-451
    await expect(errorScreen.container).not.toContainText('Internal server error')
    await expect(errorScreen.mainPageButton).toBeVisible()
  })
})
