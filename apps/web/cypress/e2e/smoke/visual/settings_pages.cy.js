import * as constants from '../../../support/constants.js'
import * as notifications from '../../pages/notifications.page.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Settings pages tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify that the setup page is displayed', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Required confirmations', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the appearance settings page is displayed', () => {
    cy.visit(constants.appearanceSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Appearance', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the modules page is displayed', () => {
    cy.visit(constants.modulesUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Safe modules', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the notifications settings page is displayed', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.get(notifications.notificationsTitle, { timeout: 30000 }).should('be.visible')
  })
})
