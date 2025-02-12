import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const currentSafe = '0x9870...fec0'
const multiChainSafe = 'matic:0xC96e...ee3B'

describe('Sidebar tests 8', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that the current safe is under the "Current safe account" section', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafe(currentSafe)
  })

  it('Verify that for multichain safes, only the safe of the current network is listed in "Current safe acount"', () => {
    wallet.connectSigner(signer)
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafe(multiChainSafe)
  })

  it('Verify that pinning a safe removes "Current safe account" section', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.clickOnBookmarkBtn(currentSafe)
    sideBar.verifyCurrentSafeDoesNotExist()
  })
})
