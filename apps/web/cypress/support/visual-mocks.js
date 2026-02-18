import * as constants from './constants'

const FIXTURES = {
  balances: 'msw/balances/safe-token-holder.json',
  portfolio: 'msw/portfolio/safe-token-holder.json',
  positions: 'msw/positions/safe-token-holder.json',
  safeApps: 'msw/safe-apps/mainnet.json',
}

const EMPTY_PAGE = { count: 0, next: null, previous: null, results: [] }

const MASTER_COPIES = [
  { address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766', version: '1.3.0' },
  { address: '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC', version: '1.4.1' },
]

/**
 * Mocks volatile CGW API endpoints for deterministic visual regression screenshots.
 * Uses shared MSW fixtures from config/test/msw/fixtures/ (via symlink).
 * Call in beforeEach() of visual tests.
 * Per-test cy.intercept() calls registered AFTER this one override these defaults
 * (Cypress uses last-registered-wins for matching intercepts).
 */
export function mockVisualTestApis() {
  cy.fixture(FIXTURES.balances).then((data) => cy.intercept('GET', constants.balancesEndpoint, data))
  cy.fixture(FIXTURES.portfolio).then((data) => cy.intercept('GET', constants.portfolioEndpoint, data))
  cy.fixture(FIXTURES.positions).then((data) => cy.intercept('GET', constants.positionsEndpoint, data))
  cy.fixture(FIXTURES.safeApps).then((data) => cy.intercept('GET', constants.appsEndpoint, data))

  cy.intercept('GET', constants.masterCopiesEndpoint, MASTER_COPIES)
  cy.intercept('GET', constants.targetedMessagingEndpoint, { outreaches: [] })

  cy.intercept('GET', constants.queuedEndpoint, EMPTY_PAGE)
  cy.intercept('GET', constants.transactionHistoryEndpoint, EMPTY_PAGE)
}
