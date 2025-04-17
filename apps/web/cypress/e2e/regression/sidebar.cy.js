import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as sideBar from '../pages/sidebar.pages'
import * as navigation from '../pages/navigation.page'
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

  it('Verify Current network is displayed at the top', () => {
    sideBar.verifyNetworkIsDisplayed(constants.networks.sepolia)
  })

  // Added to prod
  it('Verify current safe details', () => {
    sideBar.verifySafeHeaderDetails(sideBar.testSafeHeaderDetails)
  })

  it('Verify QR button opens the QR code modal', () => {
    sideBar.clickOnQRCodeBtn()
    sideBar.verifyQRModalDisplayed()
  })

  it('Verify Open blockexplorer button contain etherscan link', () => {
    sideBar.verifyEtherscanLinkExists()
  })

  // Added to prod
  it('Verify New transaction button enabled for owners', () => {
    wallet.connectSigner(signer)
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.enabled)
  })

  // Added to prod
  it('Verify New transaction button enabled for beneficiaries who are non-owners', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_11)
    wallet.connectSigner(signer)
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.enabled)
  })

  // Added to prod
  it('Verify New Transaction button disabled for non-owners', () => {
    sideBar.verifyNewTxBtnStatus(constants.enabledStates.disabled)
  })

  it('Verify the side menu buttons exist', () => {
    sideBar.verifySideListItems()
  })

  it('Verify counter in the "Transaction" menu item if there are tx in the queue tab', () => {
    sideBar.verifyTxCounter(1)
  })
})
