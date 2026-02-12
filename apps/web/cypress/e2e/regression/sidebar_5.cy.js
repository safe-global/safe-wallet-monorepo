import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Sidebar search tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the search input shows at the top above the pinned safes list', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    sideBar.openSidebar()
    sideBar.verifySearchInputPosition()
  })

  it('Verify search finds safes in the trusted list', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.searchSafe(sideBar.sideBarSafes.safe1short_)
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe1short])
    sideBar.verifySafeCount(1)
  })

  it("Verify searching for a safe name filters out those who don't match", () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.searchSafe(sideBar.sideBarSafes.safe1short_)
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe1short])
    sideBar.verifySafesDoNotExist([sideBar.sideBarSafes.safe2short])
  })

  it('Verify searching for a safe also finds safes in different networks', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe3)
    main.addSafeToTrustedList('1', sideBar.sideBarSafes.safe3)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safes2)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe(sideBar.sideBarSafes.multichain_short_)
    sideBar.checkMultichainSubSafeExists([
      // constants.networks.gnosis,
      constants.networks.ethereum,
      constants.networks.sepolia,
    ])
  })

  it('Verify search shows number of results found', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe3)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    cy.visit(constants.BALANCE_URL + safe, { skipAutoTrust: true })
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe('0x')
    sideBar.checkSearchResults(3)
  })

  it('Verify clearing the search input returns back to the trusted safes list', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    cy.visit(constants.BALANCE_URL + safe, { skipAutoTrust: true })
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe(sideBar.sideBarSafes.safe1short_)
    sideBar.checkSearchResults(1)
    sideBar.clearSearchInput()
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe1short, sideBar.sideBarSafes.safe2short])
  })
})
