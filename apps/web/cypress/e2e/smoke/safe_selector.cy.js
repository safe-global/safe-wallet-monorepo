import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
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
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    // Add multichain safe data (safe3 on Sepolia + Ethereum)
    main.addToAppLocalStorage(
      constants.localStorageKeys.SAFE_v2__addedSafes,
      ls.addedSafes.sidebarTrustedSafe3TwoChains,
    )
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safes2)

    // Chains are fetched at runtime (no build-time seed), so the added multichain
    // safe only enters the selector list once the chains config has loaded. Wait
    // for that request after reload before opening, otherwise the dropdown opens
    // with a stale current-safe-only list and never shows the multichain group.
    cy.intercept('GET', constants.chainsEndpoint).as('chainsConfig')
    cy.reload()
    cy.wait('@chainsConfig')

    safeSelector.openSelector()
    safeSelector.verifyDropdownContainsSafe(multichainSafeShortAddress)
    safeSelector.verifyMultichainSafeChainLogos(multichainSafeShortAddress, 2)

    // Wait for main content to fully load before the snapshot is captured
    cy.contains('Sepolia Ether', { timeout: 30000 }).should('be.visible')
  })
})
