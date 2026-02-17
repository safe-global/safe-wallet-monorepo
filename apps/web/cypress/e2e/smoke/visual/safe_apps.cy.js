import * as constants from '../../../support/constants.js'
import * as safeapps from '../../pages/safeapps.pages.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Safe Apps tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get(safeapps.safeAppsList, { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the Safe Apps list is displayed', () => {
    cy.get(safeapps.safeAppsList).find('li').should('have.length.at.least', 1)
  })

  it('[SMOKE] Verify that Safe Apps search filters results', () => {
    safeapps.typeAppName('Transaction Builder')
    cy.contains('Transaction Builder').should('be.visible')
  })

  it('[SMOKE] Verify that Safe Apps search shows no results state', () => {
    safeapps.typeAppName('zzzznonexistentapp12345')
    safeapps.verifyNoAppsTextPresent()
  })
})
