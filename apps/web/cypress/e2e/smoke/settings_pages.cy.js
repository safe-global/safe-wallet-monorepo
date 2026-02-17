import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as navigation from '../pages/navigation.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Settings pages tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify the setup page with owners list is displayed', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.verifyElementsExist([navigation.setupSection])
    cy.contains('Required confirmations').should('be.visible')
  })

  it('[SMOKE] Verify the appearance settings page is displayed', () => {
    cy.visit(constants.appearanceSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Appearance').should('be.visible')
    // Wait for theme controls to render
    cy.contains('Theme').should('be.visible')
    cy.contains('Copy addresses with chain prefix').should('be.visible')
  })

  it('[SMOKE] Verify the modules page is displayed', () => {
    cy.visit(constants.modulesUrl + staticSafes.SEP_STATIC_SAFE_4)
    // Wait for the modules section to fully load
    cy.contains('Safe modules', { timeout: 30000 }).should('be.visible')
    cy.contains('Transaction guards').should('be.visible')
  })

  it('[SMOKE] Verify the notifications settings page is displayed', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Notifications').should('be.visible')
    // Wait for the notification preferences UI to render
    cy.contains('Push notifications').should('be.visible')
  })
})
