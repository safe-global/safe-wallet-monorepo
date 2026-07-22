import * as constants from '../../support/constants'
import * as sideBar from '../pages/sidebar.pages'
import * as navigation from '../pages/navigation.page'
import * as swaps from '../pages/swaps.pages.js'
import { exchangeStr, clickOnBridgeOption } from '../pages/bridge.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Sidebar tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
  })

  it('Verify New transaction button enabled for owners', () => {
    wallet.connectSignerViaStorage(signer)
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.enabled)
  })

  it('Verify New transaction button enabled for beneficiaries who are non-owners', () => {
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_11)
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.enabled)
  })

  it('Verify New Transaction button disabled for non-owners', () => {
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.disabled)
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
