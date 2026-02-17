import * as constants from '../../../support/constants.js'
import * as safeapps from '../../pages/safeapps.pages.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Safe Apps screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot Safe Apps list', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get(safeapps.safeAppsList, { timeout: 30000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot Safe Apps search filtered results', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get(safeapps.safeAppsList, { timeout: 30000 }).should('be.visible')
    safeapps.typeAppName('Transaction Builder')
    cy.contains('Transaction Builder').should('be.visible')
  })

  it('[VISUAL] Screenshot Safe Apps no results state', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get(safeapps.safeAppsList, { timeout: 30000 }).should('be.visible')
    safeapps.typeAppName('zzzznonexistentapp12345')
    cy.contains(/no Safe Apps found/i, { timeout: 10000 }).should('be.visible')
  })
})
