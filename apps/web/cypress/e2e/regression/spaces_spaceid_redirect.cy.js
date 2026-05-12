import * as space from '../pages/spaces.page.js'
import * as wallet from '../../support/utils/wallet.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const owner = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Spaces spaceId URL redirect tests', () => {
  beforeEach(() => {
    cy.clearAllCookies()
    cy.clearAllLocalStorage()
  })

  it('Verify that visiting /home?spaceId=<id> while signed out bounces to sign-in and returns to the original URL after sign-in', () => {
    const spaceId = staticSpaces.dashboardWithSafes.id
    const originalAsPath = `/home?spaceId=${spaceId}`

    // Action: visit a spaceId-only home URL while signed out
    cy.visit(originalAsPath)

    // Assertion: the user is bounced to /welcome/spaces with the original URL preserved as ?redirect
    space.verifyBouncedToSignInWithRedirect(originalAsPath)

    // Action: sign in via the wallet
    wallet.connectSigner(owner)
    space.clickOnSignInBtn()

    // Assertion: after sign-in the user lands on the originally requested /home?spaceId=<id>
    space.verifyHomeUrlIncludesSpaceId(spaceId)
  })
})
