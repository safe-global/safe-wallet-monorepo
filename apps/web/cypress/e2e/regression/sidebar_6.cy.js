import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const aSafe = 'Safe A'
const bSafe = 'Safe B'
const safe14 = 'Safe 14'
const safe15 = 'Safe 15'

describe('Sidebar sorting tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the same safe of the different networks is ordered by most recent', () => {
    let safe_eth = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    let safe_gno = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'gno')
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safes2)
    wallet.connectSigner(signer)
    cy.visit(constants.BALANCE_URL + safe_eth)
    cy.visit(constants.BALANCE_URL + safe_gno)

    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe('96')
    sideBar.checkSearchResults(1)
    sideBar.verifySafeCount(3)
    sideBar.verifyAddedSafesExistByIndex(1, constants.networks.gnosis)
    sideBar.verifyAddedSafesExistByIndex(2, constants.networks.ethereum)
  })

  it('Verify the same safe of the different networks is ordered by name', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.undeployedSet)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safes2)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    wallet.connectSigner(signer)

    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe('96')
    sideBar.verifySafeCount(3)
    sideBar.expandGroupSafes(0)
    sideBar.openSortOptionsMenu()
    sideBar.selectSortOption(sideBar.sortOptions.name)
    sideBar.verifyAddedSafesExistByIndex(1, aSafe)
    sideBar.verifyAddedSafesExistByIndex(2, bSafe)
  })

  it('Verify that a pinned safe can be sorted by name and last visited', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.pagination)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__visitedSafes, ls.visitedSafes.set1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafes.safe1, sideBar.sideBarSafes.safe2],
    })
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.searchSafe('15')
    cy.wait(1000)
    sideBar.clickOnBookmarkBtn(sideBar.sideBarSafes.safe2short)
    sideBar.clearSearchInput()
    sideBar.searchSafe('14')
    cy.wait(1000)
    sideBar.clickOnBookmarkBtn(sideBar.sideBarSafes.safe1short)
    sideBar.clearSearchInput()

    sideBar.verifyPinnedSafe(sideBar.sideBarSafes.safe2short)
    sideBar.verifyPinnedSafe(sideBar.sideBarSafes.safe1short)

    sideBar.openSortOptionsMenu()
    sideBar.selectSortOption(sideBar.sortOptions.name)
    sideBar.verifyAddedSafesExistByIndex(1, safe14)
    sideBar.verifyAddedSafesExistByIndex(2, safe15)
    sideBar.selectSortOption(sideBar.sortOptions.lastVisited)
    sideBar.verifyAddedSafesExistByIndex(1, safe15)
    sideBar.verifyAddedSafesExistByIndex(2, safe14)
  })
})
