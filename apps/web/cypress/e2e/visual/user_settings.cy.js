import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe(
  '[VISUAL] User settings page screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    beforeEach(() => {
      mockVisualTestApis()
    })

    it('[VISUAL] Screenshot user settings page', () => {
      main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, {
        sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        lastUsedSpace: null,
      })

      cy.fixture('spaces/user.json').then((mockUser) => {
        cy.intercept('GET', constants.usersEndpoint, mockUser).as('getUser')
      })

      cy.visit(constants.userSettingsUrl)
      cy.contains('Manage Wallets', { timeout: 30000 }).should('be.visible')
      main.awaitVisualStability()
    })
  },
)
