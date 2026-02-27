import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar_new.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Sidebar tests', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.ensureSiweSession(signer)
  })

  it('[SMOKE] Verify Safe sidebar displays with navigation items', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.contains('Sepolia Ether', { timeout: 30000 }).should('be.visible')
    sideBar.verifySafePageExists(sideBar.SAFE_SIDEBAR_PAGES.OVERVIEW)
    sideBar.verifySafePageExists(sideBar.SAFE_SIDEBAR_PAGES.ASSETS)
    sideBar.verifySafePageExists(sideBar.SAFE_SIDEBAR_PAGES.TRANSACTIONS)
  })

  it('[SMOKE] Verify Safe sidebar navigation to Assets page works', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    sideBar.clickOnSafeAssets()
    cy.get('[data-testid="table-container"]').should('be.visible')
  })

  it('[SMOKE] Verify Back to Space button navigates from Safe to Spaces view', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    cy.get(sideBar.backToSpaceBtn).should('be.visible')
    sideBar.goBackToSpace()
    cy.url().should('include', 'spaceId=')
    cy.get('[data-testid="space-selector-dropdown"]').should('be.visible')
  })

  it('[SMOKE] Verify Spaces sidebar dropdown opens and displays menu items', () => {
    sideBar.openSpacesDropdown()
    cy.get('[role="menu"]').should('be.visible')
    cy.contains('[role="menuitem"]', 'Create space').should('be.visible')
    cy.contains('[role="menuitem"]', 'View spaces').should('be.visible')
  })

  it('[SMOKE] Verify Spaces sidebar navigation to Team page works', () => {
    sideBar.clickOnSpacesTeam()
    cy.url().should('include', '/members')
    cy.contains('h1', 'Members').should('be.visible')
  })
})
