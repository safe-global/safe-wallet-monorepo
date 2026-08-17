import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { signInToSpaces } from '../../support/spaces-login.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const SPACE_ID = staticSpaces.dashboardWithSafes.uuid

describe('[VISUAL] Spaces activity screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    signInToSpaces()
  })

  it('[VISUAL] Screenshot spaces activity page', () => {
    cy.visit(constants.spaceActivityUrl + SPACE_ID)
    main.awaitVisualStability()
  })
})
