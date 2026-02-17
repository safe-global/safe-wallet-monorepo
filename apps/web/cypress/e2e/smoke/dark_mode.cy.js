import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
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
    // Verify dark theme is applied and token table renders
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify the dashboard is displayed in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    // Verify dark theme is applied and dashboard widgets render
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.contains('Overview', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify the settings setup page is displayed in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    // Verify dark theme is applied and owner list renders
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    main.verifyElementsExist(['[data-testid="owner-row"]'])
  })
})
