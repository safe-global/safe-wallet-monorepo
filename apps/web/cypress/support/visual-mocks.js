import * as constants from './constants'

const FIXTURES = {
  chains: 'msw/chains/all.json',
  safeInfo: 'msw/safes/sepolia.json',
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
  // Chain config — prevents empty sidebar when CGW is slow
  cy.fixture(FIXTURES.chains).then((data) => {
    cy.intercept('GET', constants.chainsEndpoint, data)
    cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
      const chainId = req.url.split('/').pop().split('?')[0]
      const chain = data.results.find((c) => c.chainId === chainId)
      req.reply(chain || { statusCode: 404 })
    })
  })

  // Safe info — dynamically patches address/chainId from the request URL
  cy.fixture(FIXTURES.safeInfo).then((data) => {
    cy.intercept('GET', constants.safeInfoEndpoint, (req) => {
      const parts = req.url.split('/')
      const safeAddress = parts.pop()
      // walk back to find chainId: .../chains/{chainId}/safes/{safeAddress}
      const chainsIdx = parts.indexOf('chains')
      const chainId = chainsIdx !== -1 ? parts[chainsIdx + 1] : data.chainId
      req.reply({
        ...data,
        address: { ...data.address, value: safeAddress },
        chainId,
      })
    })
  })

  cy.fixture(FIXTURES.balances).then((data) => cy.intercept('GET', constants.balancesEndpoint, data))
  cy.fixture(FIXTURES.portfolio).then((data) => cy.intercept('GET', constants.portfolioEndpoint, data))
  cy.fixture(FIXTURES.positions).then((data) => cy.intercept('GET', constants.positionsEndpoint, data))
  cy.fixture(FIXTURES.safeApps).then((data) => cy.intercept('GET', constants.appsEndpoint, data))

  cy.intercept('GET', constants.masterCopiesEndpoint, MASTER_COPIES)
  cy.intercept('GET', constants.targetedMessagingEndpoint, { outreaches: [] })

  cy.intercept('GET', constants.queuedEndpoint, EMPTY_PAGE)
  cy.intercept('GET', constants.transactionHistoryEndpoint, EMPTY_PAGE)
}
