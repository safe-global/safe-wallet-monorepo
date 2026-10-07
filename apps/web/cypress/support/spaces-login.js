import * as constants from './constants.js'
import * as wallet from './utils/wallet.js'
import * as space from '../e2e/pages/spaces.page.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))

export const spacesOwner = walletCredentials.OWNER_1_PRIVATE_KEY

// Signs in to the Spaces welcome page with a real wallet + SIWE, mirroring the
// regression flow in spaces_dashboard.cy.js. No mocks: hits the real backend.
export function signInToSpaces(signer = spacesOwner) {
  wallet.connectSignerViaStorage(signer, constants.spacesUrl)
  space.clickOnSignInBtn()
  space.waitForSpacesWelcomeReady()
}
