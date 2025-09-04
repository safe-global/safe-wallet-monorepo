import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as create_wallet from '../pages/create_wallet.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Sidebar tests 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the empty state of the "All accounts" list', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifySafeListIsEmpty()
  })

  it('Verify the empty state of the pinned safes list', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 137: [], 143: [], 17000: null, 560048: [], 11155111: [] })
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyPinnedListIsEmpty()
  })

  it('Verify connected user is redirected from welcome page to accounts page', () => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    wallet.connectSigner(signer)
    create_wallet.clickOnContinueWithWalletBtn()

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/welcome/accounts')
    })
  })

  it('Verify that the user see safes that he owns in the list', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafes.safe1, sideBar.sideBarSafes.safe2],
    })
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe1short, sideBar.sideBarSafes.safe2short])
  })

  it('Verify there is an option to name an unnamed safe', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafes.safe1, sideBar.sideBarSafes.safe2],
    })
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifySafeGiveNameOptionExists(0)
  })
})
