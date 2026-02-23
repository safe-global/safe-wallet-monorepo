import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Sidebar screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot sidebar with multichain safes expanded', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    main.addToAppLocalStorage(
      constants.localStorageKeys.SAFE_v2__addedSafes,
      ls.addedSafes.sidebarTrustedSafe3TwoChains,
    )
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safes2)
    cy.reload()

    sideBar.openSidebar()
    sideBar.searchSafe(sideBar.sideBarSafes.multichain_short_)
    sideBar.expandGroupSafes(0)
    main.waitForMuiAnimationsToSettle()
    sideBar.checkMultichainSubSafeExists([constants.networks.ethereum, constants.networks.sepolia])

    cy.contains('Sepolia Ether', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
