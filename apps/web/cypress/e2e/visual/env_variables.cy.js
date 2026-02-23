import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Environment variables settings screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot environment variables settings page', () => {
      cy.visit(constants.envVariablesUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains('Environment variables', { timeout: 30000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
