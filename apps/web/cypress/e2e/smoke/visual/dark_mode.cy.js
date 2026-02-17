import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'
import * as ls from '../../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Dark mode screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot balances page in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot dashboard in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains('Top assets', { timeout: 30000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot settings setup page in dark mode', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Required confirmations', { timeout: 30000 }).should('be.visible')
  })
})
