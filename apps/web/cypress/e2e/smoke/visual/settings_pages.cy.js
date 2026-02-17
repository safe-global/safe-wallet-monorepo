import * as constants from '../../../support/constants.js'
import * as notifications from '../../pages/notifications.page.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Settings pages screenshots', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Screenshot setup page', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Required confirmations', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Screenshot appearance settings page', () => {
    cy.visit(constants.appearanceSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Appearance', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Screenshot modules page', () => {
    cy.visit(constants.modulesUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Safe modules', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Screenshot notifications settings page', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.get(notifications.notificationsTitle, { timeout: 30000 }).should('be.visible')
  })
})
