import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wc from '../pages/walletconnect.page.js'
import * as main from '../pages/main.page.js'

let staticSafes = []

describe('Walletconnect tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that connection via WC is not allowed when no selected safe in URL', () => {
    cy.visit(constants.homeUrl)
    wc.clickOnWCBtn()
    cy.contains(wc.connectWCStr).should('be.visible')
    main.verifyElementsCount(wc.wcInput, 0)
  })
})
