import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { signInToSpaces } from '../../support/spaces-login.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const SPACE_ID = staticSpaces.dashboardWithSafes.uuid

describe('[VISUAL] Spaces settings screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    signInToSpaces()
  })

  it('[VISUAL] Screenshot spaces settings general page', () => {
    cy.visit(constants.spaceSettingsGeneralUrl + SPACE_ID)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces settings account page', () => {
    cy.visit(constants.spaceSettingsAccountUrl + SPACE_ID)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot spaces settings about page', () => {
    cy.visit(constants.spaceSettingsAboutUrl + SPACE_ID)
    main.awaitVisualStability()
  })
})
