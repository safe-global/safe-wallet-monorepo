import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Transaction queue screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
        cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
        cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_2)
      })
      cy.wait('@getQueuedTransactions')
      cy.contains('Batch', { timeout: 10000 }).should('be.visible')
    })

    it('[VISUAL] Screenshot queue page with pending transactions', () => {
      main.verifySkeletonsGone()
    })

    it('[VISUAL] Screenshot expanded queued transaction details', () => {
      cy.contains('Batch').first().click()
      main.waitForMuiAnimationsToSettle()
      main.verifySkeletonsGone()
    })
  },
)
