import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Transaction queue tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify the queue page with pending transactions is displayed', () => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
    // Wait for the transaction list to fully render with multiple items
    cy.contains('Batch').should('be.visible')
    cy.contains('addOwnerWithThreshold').should('be.visible')
  })

  it('[SMOKE] Verify expanding a queued transaction shows details', () => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
    // Click on the first transaction to expand it
    cy.contains('Batch').first().click()
    // Wait for the expanded details panel to render
    cy.get('[data-testid="accordion-details"]', { timeout: 10000 }).should('be.visible')
  })
})
