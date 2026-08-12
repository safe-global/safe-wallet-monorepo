import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as space from '../pages/spaces.page.js'
import { signInToSpaces } from '../../support/spaces-login.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const SPACE_ID = staticSpaces.dashboardWithSafes.uuid

describe(
  '[VISUAL] Spaces dashboard screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    beforeEach(() => {
      signInToSpaces()
      cy.visit(constants.spaceDashboardUrl + SPACE_ID)
    })

    it('[VISUAL] Screenshot spaces dashboard page', () => {
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot spaces dashboard send modal', () => {
      space.clickOnSpaceDashboardSendBtn()
      space.verifySendFromModalOpen()
      main.awaitVisualStability()
    })
  },
)
