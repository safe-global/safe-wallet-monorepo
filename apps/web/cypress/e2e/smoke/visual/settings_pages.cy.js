import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'
import * as navigation from '../../pages/navigation.page.js'
import * as notifications from '../../pages/notifications.page.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Settings pages tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify that the setup page with owners list is displayed', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.verifyElementsExist([navigation.setupSection])
    cy.contains('Required confirmations', { timeout: 10000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the appearance settings page is displayed', () => {
    cy.visit(constants.appearanceSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Appearance', { timeout: 10000 }).should('be.visible')
    cy.contains('Theme').should('be.visible')
    cy.contains('Copy addresses with chain prefix').should('be.visible')
  })

  it('[SMOKE] Verify that the modules page is displayed', () => {
    cy.visit(constants.modulesUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Safe modules', { timeout: 30000 }).should('be.visible')
    cy.contains('Transaction guards').should('be.visible')
  })

  it('[SMOKE] Verify that the notifications settings page is displayed', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_4)
    notifications.checkCoreElementsVisible()
  })
})
