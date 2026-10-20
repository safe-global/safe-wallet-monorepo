import * as constants from '../../support/constants'
import * as sideBar from '../pages/sidebar.pages'
import * as swaps from '../pages/swaps.pages.js'
import { exchangeStr, clickOnBridgeOption } from '../pages/bridge.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Sidebar tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Disconnected', () => {
    beforeEach(() => {
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    })

    it('Verify the side menu buttons exist', () => {
      sideBar.verifySideListItemsNew()
    })

    it('Verify counter in the "Transaction" menu item if there are tx in the queue tab', () => {
      sideBar.verifyTxCounterNew(1)
    })

    it('Verify that clicking on Bridge in the sidebar opens the exchange iframe', () => {
      const iframeSelector = `iframe[src*="${constants.bridgeWidget}"]`

      clickOnBridgeOption()
      swaps.acceptLegalDisclaimer()

      cy.get(iframeSelector).should('be.visible')
      cy.get(iframeSelector).then(($iframe) => {
        const $body = $iframe.contents().find('body')
        cy.wrap($body).should('exist')
        cy.wrap($body).contains(exchangeStr).should('be.visible')
      })
    })
  })
})
