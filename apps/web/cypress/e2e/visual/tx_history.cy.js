import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Transaction history screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot transaction history page', () => {
      cy.intercept('GET', constants.transactionHistoryEndpoint, { fixture: 'history/history_tx_1.json' }).as(
        'getHistory',
      )
      cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_23)
      cy.wait('@getHistory')
      cy.contains('Received', { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
