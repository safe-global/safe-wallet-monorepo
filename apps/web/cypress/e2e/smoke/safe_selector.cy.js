import * as constants from '../../support/constants.js'
import * as safeSelector from '../pages/safe_navigation.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const multichainSafeShortAddress = '0xC96e'

describe('[SMOKE] Safe selector tests', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify the safe selector dropdown displays multichain safes', () => {
    // Add multichain safe data (safe3 on Sepolia + Ethereum)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          constants.localStorageKeys.SAFE_v2__addedSafes,
          JSON.stringify(ls.addedSafes.sidebarTrustedSafe3TwoChains),
        )
        win.localStorage.setItem(
          constants.localStorageKeys.SAFE_v2__undeployedSafes,
          JSON.stringify(ls.undeployedSafe.safes2),
        )
      },
    })

    // Chains are fetched at runtime now (no build-time seed) and the selector
    // snapshots its safe list when opened, so it must only be opened once chain
    // configs are fully loaded. Waiting for the current safe's balance to render
    // ('Sepolia Ether' comes from the chain config) gates on that before opening,
    // otherwise the multichain group renders with fewer than two chain logos.
    cy.contains('Sepolia Ether', { timeout: 60000 }).should('be.visible')

    safeSelector.openSelector()
    safeSelector.verifyDropdownContainsSafe(multichainSafeShortAddress)
    safeSelector.verifyMultichainSafeChainLogos(multichainSafeShortAddress, 2)
  })
})
