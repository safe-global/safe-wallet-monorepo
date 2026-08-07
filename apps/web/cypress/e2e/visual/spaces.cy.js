import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { signInToSpaces } from '../../support/spaces-login.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const SPACE_ID = staticSpaces.dashboardWithSafes.uuid

describe('[VISUAL] Spaces page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    signInToSpaces()
  })

  it('[VISUAL] Screenshot spaces settings page', () => {
    cy.visit(constants.spaceUrl + SPACE_ID)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces members page', () => {
    cy.visit(constants.spaceMembersUrl + SPACE_ID)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces safe accounts page', () => {
    cy.visit(constants.spaceSafeAccountsUrl + SPACE_ID)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces address book page', () => {
    cy.visit(constants.spaceAddressBookUrl + SPACE_ID)
    main.awaitVisualStability()
  })
})
