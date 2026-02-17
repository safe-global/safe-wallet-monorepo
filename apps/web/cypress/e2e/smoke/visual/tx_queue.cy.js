import * as constants from '../../../support/constants.js'
import * as createtx from '../../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Transaction queue tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
  })

  it('[SMOKE] Verify that the queue page with pending transactions is displayed', () => {
    cy.contains('Batch', { timeout: 10000 }).should('be.visible')
    cy.contains(createtx.addOwnerWithThreshold).should('be.visible')
  })

  it('[SMOKE] Verify that expanding a queued transaction shows details', () => {
    createtx.clickOnTransactionItemByName('Batch')
  })
})
