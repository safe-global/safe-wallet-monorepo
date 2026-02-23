import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Custom Safe Apps screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot custom Safe Apps page', () => {
      cy.visit(constants.appsCustomUrl + staticSafes.SEP_STATIC_SAFE_2)
      cy.contains('Custom apps', { timeout: 30000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
