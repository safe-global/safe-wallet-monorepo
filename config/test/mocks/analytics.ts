/**
 * Reusable mock for @/services/analytics
 *
 * This mock provides common analytics exports including EventType enum
 * that can be used across test files.
 *
 * Usage (from @safe-global/web tests):
 * jest.mock('@/services/analytics', () =>
 *   (jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }).createAnalyticsMock(),
 * )
 *
 * Or with additional test-specific overrides:
 * jest.mock('@/services/analytics', () => ({
 *   ...(jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }).createAnalyticsMock(),
 *   ASSETS_EVENTS: { ... },
 * }))
 *
 * Note: Use jest.requireActual() inside jest.mock() to avoid hoisting issues with ES6 imports.
 */

export const EventType = {
  PAGEVIEW: 'pageview',
  CLICK: 'customClick',
  META: 'metadata',
  SAFE_APP: 'safeApp',
  SAFE_CREATED: 'safe_created',
  SAFE_ACTIVATED: 'safe_activated',
  SAFE_OPENED: 'safe_opened',
  WALLET_CONNECTED: 'wallet_connected',
  TX_CREATED: 'tx_created',
  TX_CONFIRMED: 'tx_confirmed',
  TX_EXECUTED: 'tx_executed',
} as const

/**
 * Factory function that creates a fresh analytics mock.
 * Use this in jest.mock() calls to avoid hoisting issues.
 */
export function createAnalyticsMock() {
  return {
    trackEvent: jest.fn(),
    trackSafeAppEvent: jest.fn(),
    trackMixpanelEvent: jest.fn(),
    EventType,
  }
}
