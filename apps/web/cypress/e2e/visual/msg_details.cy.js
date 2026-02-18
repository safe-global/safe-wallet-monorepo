import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Message detail page screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot message detail page', () => {
      cy.fixture('messages/messages.json').then((mockData) => {
        cy.intercept('GET', constants.messagesEndpoint, mockData).as('getMessages')
        cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_23)
      })
      cy.wait('@getMessages')
      cy.contains('Sign', { timeout: 10000 }).should('be.visible')
      cy.get(createtx.messageItem).first().click()
      main.waitForMuiAnimationsToSettle()
      cy.contains('Created by', { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
