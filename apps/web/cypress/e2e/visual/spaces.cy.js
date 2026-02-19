import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

const SPACE_ID = '1'

function setupSpacesAuth() {
  main.enableChainFeature(constants.chainFeatures.spaces)

  main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, {
    sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    lastUsedSpace: SPACE_ID,
  })

  cy.fixture('spaces/user.json').then((mockUser) => {
    cy.intercept('GET', constants.usersEndpoint, mockUser).as('getUser')
  })
  cy.fixture('spaces/space.json').then((mockSpace) => {
    cy.intercept('GET', constants.spacesSafesEndpoint, { safes: {} }).as('getSpaceSafes')
    cy.intercept('GET', constants.spacesGetOneEndpoint, mockSpace).as('getSpace')
    cy.intercept('GET', `${constants.stagingCGWUrlv1}/spaces`, [mockSpace]).as('getSpaces')
  })
  cy.fixture('spaces/members.json').then((mockMembers) => {
    cy.intercept('GET', constants.spacesMembersEndpoint, mockMembers).as('getSpaceMembers')
  })
  cy.fixture('spaces/address_book.json').then((mockAddressBook) => {
    cy.intercept('GET', constants.spacesAddressBookEndpoint, mockAddressBook).as('getSpaceAddressBook')
  })
}

describe('[VISUAL] Spaces page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    mockVisualTestApis()
    setupSpacesAuth()
  })

  it('[VISUAL] Screenshot spaces dashboard page', () => {
    cy.visit(constants.spaceDashboardUrl + SPACE_ID)
    cy.contains('Getting started', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces settings page', () => {
    cy.visit(constants.spaceUrl + SPACE_ID)
    cy.contains('Settings', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces members page', () => {
    cy.visit(constants.spaceMembersUrl + SPACE_ID)
    cy.contains('Members', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces safe accounts page', () => {
    cy.visit(constants.spaceSafeAccountsUrl + SPACE_ID)
    cy.contains('Safe Accounts', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces address book page', () => {
    cy.visit(constants.spaceAddressBookUrl + SPACE_ID)
    cy.contains('Address book', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })
})
