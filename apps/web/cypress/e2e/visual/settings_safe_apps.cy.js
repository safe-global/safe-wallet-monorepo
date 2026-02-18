import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Safe Apps settings screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot Safe Apps permissions settings page', () => {
      cy.visit(constants.safeAppsSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains('Signing method', { timeout: 30000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
