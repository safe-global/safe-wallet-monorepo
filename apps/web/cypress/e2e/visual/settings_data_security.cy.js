import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe(
  '[VISUAL] Data and Security settings screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      mockVisualTestApis()
    })

    it('[VISUAL] Screenshot data settings page', () => {
      cy.visit(constants.dataSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains('Data', { timeout: 30000 }).should('be.visible')
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot security settings page', () => {
      cy.visit(constants.securityUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains('Security', { timeout: 30000 }).should('be.visible')
      main.awaitVisualStability()
    })
  },
)
