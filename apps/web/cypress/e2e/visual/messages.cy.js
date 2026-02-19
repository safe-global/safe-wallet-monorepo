import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Off-chain messages screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot messages page', () => {
      cy.fixture('messages/messages.json').then((mockData) => {
        cy.intercept('GET', constants.messagesEndpoint, mockData).as('getMessages')
        cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_23)
      })
      cy.wait('@getMessages')
      cy.contains('Sign', { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
