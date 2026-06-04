import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as space from '../pages/spaces.page.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const admin = walletCredentials.OWNER_4_PRIVATE_KEY
const user = walletCredentials.OWNER_3_PRIVATE_KEY
const user_address = walletCredentials.OWNER_3_WALLET_ADDRESS

describe('Spaces basic flow tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.spacesUrl)
  })

  it('Verify a user can sign in, create, rename and delete an organisation', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)
    const newSpaceName = 'Renamed Space' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.ensureReadyToCreateSpace()
    cy.wait(3000)
    space.createSpaceViaOnboardingWithSkip(spaceName)

    space.clickOnSpaceSelector(spaceName)
    space.spaceExists(spaceName)
    space.goToSpaceSettings()
    space.verifySpaceSettingsGeneralLoaded()
    space.editSpace(newSpaceName)
    space.clickOnSpaceSelector(newSpaceName)
    space.spaceExists(newSpaceName)
    space.deleteSpace(newSpaceName)
    cy.contains(space.deleteSpaceConfirmationMsg(newSpaceName)).should('be.visible')
    main.verifyElementsIsVisible([space.createSpaceBtn])
  })

  it('Verify an account can be added manually', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.ensureReadyToCreateSpace()
    cy.wait(3000)
    space.createSpaceViaOnboardingWithSkip(spaceName)
    space.addAccountManually(staticSafes.SEP_STATIC_SAFE_35.substring(4), constants.networks.sepolia)
  })

  // Skipping this test as it is not possible to log out on localhost:
  // there is a redirect to the page https://safe-client.staging.5afe.dev/v1/auth/logout/redirect after clicking sign out,
  // and test is failing
  it.skip('Verify that re-signing in lands on the single space, not on /welcome/create-space', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.ensureReadyToCreateSpace()
    cy.wait(3000)
    space.createSpaceViaOnboardingWithSkip(spaceName)

    space.signOutViaSidebarProfile()
    wallet.connectSigner(admin)
    space.clickOnSignInBtn()

    // With exactly one space, sign-in should short-circuit straight to the
    // space dashboard. Crucially we must NOT be bounced into /welcome/create-space
    // (the regressed re-login behavior).
    space.verifyOnSingleSpaceDashboard(spaceName)

    space.goToSpaceSettings()
    space.deleteSpace(spaceName)
  })

  it.only('Verify a new member can be invited and accept the invite', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)
    const memberName = 'Member ' + Math.random().toString(36).substring(2, 12)
    const newInviteName = 'Invited member ' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.ensureReadyToCreateSpace()
    cy.wait(3000)
    space.createSpaceViaOnboardingWithSkip(spaceName)
    space.clickOnSpaceSelector()
    space.spaceExists(spaceName)

    space.goToSpaceMembers()
    space.addMember(memberName, user_address)
    space.disconnectFromSpaceLevel()
    wallet.connectSigner(user)
    space.clickOnSignInBtn()
    space.verifySpaceInviteBannerVisible(spaceName)
    space.acceptInvite(newInviteName)
    main.verifyElementByTextExists(space.acceptInviteConfirmationMsg(spaceName))
  })
})
