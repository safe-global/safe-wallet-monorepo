import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as dashboard from '../pages/dashboard.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Dashboard screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot dashboard page', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains('Top assets', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot dashboard with pending transactions widget', () => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
    cy.get(dashboard.pendingTxWidget, { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
