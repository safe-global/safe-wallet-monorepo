import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as navigation from '../pages/navigation.page.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Dark mode tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify the balances page is displayed in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
    cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'dark')
  })

  it('[SMOKE] Verify the dashboard is displayed in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains('Overview', { timeout: 30000 }).should('be.visible')
    cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'dark')
  })

  it('[SMOKE] Verify the settings setup page is displayed in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.verifyElementsExist([navigation.setupSection])
    cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'dark')
  })
})
