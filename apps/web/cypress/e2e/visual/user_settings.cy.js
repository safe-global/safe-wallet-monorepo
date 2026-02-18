import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'

const mockUser = {
  id: 1,
  status: 1,
  wallets: [{ id: 1, address: '0x1234567890123456789012345678901234567890' }],
}

describe(
  '[VISUAL] User settings page screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    it('[VISUAL] Screenshot user settings page', () => {
      // Mock auth state in localStorage (session expires 24h from now)
      const authData = {
        sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        lastUsedSpace: null,
      }
      main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, authData)

      // Mock user API endpoint
      cy.intercept('GET', constants.usersEndpoint, mockUser).as('getUser')

      cy.visit(constants.userSettingsUrl)
      cy.contains('Manage Wallets', { timeout: 30000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
