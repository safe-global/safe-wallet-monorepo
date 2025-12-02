/**
 * Test helpers for tx flow storage
 *
 * These utilities can be used in Cypress/Playwright tests to:
 * - Pre-fill transaction flows with mock data
 * - Test flow restoration behavior
 * - Skip manual input during E2E tests
 */

import type { SerializedTxFlowState } from './txFlowStorage'

const TX_FLOW_STORAGE_KEY = 'txFlowState_v1'

/**
 * Set mock tx flow state in session storage (for use in tests)
 *
 * @example
 * // In Cypress test
 * cy.visit('/home?safe=eth:0x123')
 * cy.window().then((win) => {
 *   setMockTxFlowState(win, 'TokenTransfer', 1, {
 *     recipients: [{
 *       recipient: 'vitalik.eth',
 *       tokenAddress: '0x...',
 *       amount: '5'
 *     }]
 *   })
 * })
 *
 * @example
 * // In Playwright test
 * await page.evaluate((mockState) => {
 *   sessionStorage.setItem('txFlowState_v1', JSON.stringify(mockState))
 * }, {
 *   flowType: 'TokenTransfer',
 *   step: 1,
 *   data: { recipients: [{ recipient: 'vitalik.eth', tokenAddress: '0x...', amount: '5' }] },
 *   timestamp: Date.now()
 * })
 */
export const setMockTxFlowState = <T>(
  window: Window,
  flowType: string,
  step: number,
  data: T,
  txId?: string,
  txNonce?: number,
) => {
  const state: SerializedTxFlowState<T> = {
    flowType,
    step,
    data,
    txId,
    txNonce,
    timestamp: Date.now(),
  }

  window.sessionStorage.setItem(TX_FLOW_STORAGE_KEY, JSON.stringify(state))
}

/**
 * Get mock tx flow state from session storage (for verification in tests)
 */
export const getMockTxFlowState = <T = any>(window: Window): SerializedTxFlowState<T> | null => {
  const stored = window.sessionStorage.getItem(TX_FLOW_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as SerializedTxFlowState<T>
  } catch {
    return null
  }
}

/**
 * Clear mock tx flow state from session storage (for test cleanup)
 */
export const clearMockTxFlowState = (window: Window) => {
  window.sessionStorage.removeItem(TX_FLOW_STORAGE_KEY)
}

/**
 * Example mock data for common flow types
 */
export const mockTxFlowData = {
  TokenTransfer: {
    single: {
      recipients: [
        {
          recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          tokenAddress: '0x0000000000000000000000000000000000000000', // Native token
          amount: '1',
        },
      ],
      type: 'multiSig',
    },
    batch: {
      recipients: [
        {
          recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          amount: '1',
        },
        {
          recipient: 'vitalik.eth',
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
          amount: '100',
        },
      ],
      type: 'multiSig',
    },
  },
  // Add more flow types as needed
}
