import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as swaps from '../pages/swaps.pages.js'
import * as main from '../pages/main.page.js'
import { exchangeStr, clickOnBridgeOption } from '../pages/bridge.pages.js'

let staticSafes = []

describe('Sidebar UI tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  const views = [
    constants.appsUrlGeneral,
    constants.homeUrl,
    constants.appsCustomUrl,
    constants.securityUrl,
    constants.transactionUrl,
    constants.transactionQueueUrl,
    constants.transactionsMessagesUrl,
    constants.transactionsHistoryUrl,
    constants.swapUrl,
    constants.setupUrl,
    constants.notificationsUrl,
    constants.modulesUrl,
    constants.dataSettingsUrl,
    constants.appearanceSettingsUrl,
    constants.balanceNftsUrl,
    constants.BALANCE_URL,
  ]
  views.forEach((link) => {
    it(`Verify sidebar copy address button copies address in view: ${link}`, () => {
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      cy.get(sideBar.copyAddressBtn).should('be.visible').should('be.enabled')
      cy.wait(2000)
      sideBar.clickOnCopyAddressBtn(staticSafes.SEP_STATIC_SAFE_4.substring(4))
    })
  })

  views.forEach((link) => {
    it(`Verify that what's new button is present in view: ${link}`, () => {
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      sideBar.whatsNewBtnIsVisible()
    })
  })

  views.forEach((link) => {
    it(`Verify that Need Help button contains help link in view: ${link}`, () => {
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      sideBar.checkNeedHelpBtnLink()
    })
  })

  views.forEach((link) => {
    it(`Verify that clicking on Bridge opens exchange modal in view: ${link}`, () => {
      let iframeSelector = `iframe[src*="${constants.bridgeWidget}"]`
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      clickOnBridgeOption()
      swaps.acceptLegalDisclaimer()
      main
        .getIframeBody(iframeSelector)
        .within(() => {
          cy.contains(exchangeStr).should('be.visible')
        })
    })
  })
})
