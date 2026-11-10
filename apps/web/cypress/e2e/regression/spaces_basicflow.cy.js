import * as main from '../pages/main.page.js'
import * as space from '../pages/spaces.page.js'
import { walletCredentials } from '../../support/credentials.js'

let admin, user, user_address
before(() => {
  admin = walletCredentials.OWNER_4_PRIVATE_KEY
  user = walletCredentials.OWNER_3_PRIVATE_KEY
  user_address = walletCredentials.OWNER_3_WALLET_ADDRESS
})

describe('Spaces basic flow tests', () => {
  beforeEach(() => {
    space.blockBeamer()
    space.interceptSpacesList()
    space.visitSpacesView()
  })

  it('Verify a user can sign in, create, rename and delete an organisation', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)
    const newSpaceName = 'Renamed Space' + Math.random().toString(36).substring(2, 12)

    space.signInWithWallet(admin)
    space.goToSpacesView()
    space.ensureReadyToCreateSpace()
    space.createSpaceViaOnboardingWithSkip(spaceName)

    space.clickOnSpaceSelector()
    space.spaceExists(spaceName)
    space.goToSpaceSettings()
    space.verifySpaceSettingsGeneralLoaded()
    space.editSpace(newSpaceName)
    space.clickOnSpaceSelector()
    space.spaceExists(newSpaceName)
    space.deleteSpace(newSpaceName)
    cy.contains(space.deleteSpaceConfirmationMsg(newSpaceName)).should('be.visible')
    main.verifyElementsIsVisible([space.createSpaceBtn])
  })

  it('Verify a new member can be invited and accept the invite', () => {
    const spaceName = 'Space ' + Math.random().toString(36).substring(2, 12)
    const memberName = 'Member ' + Math.random().toString(36).substring(2, 12)
    const newInviteName = 'Invited member ' + Math.random().toString(36).substring(2, 12)

    space.signInWithWallet(admin)
    space.goToSpacesView()
    space.ensureReadyToCreateSpace()
    space.createSpaceViaOnboardingWithSkip(spaceName)
    space.clickOnSpaceSelector()
    space.spaceExists(spaceName)

    space.goToSpaceMembers()
    space.addMember(memberName, user_address)
    space.disconnectFromSpaceLevel()
    cy.clearAllCookies()
    space.visitSpacesView()
    space.signInWithWallet(user)
    // No reload here: a member with a pending invite is kept on /welcome/spaces after sign-in
    // (useSignInRedirect only redirects when there are no invites), and a full reload would drop the
    // freshly-connected injected wallet and leave the page blank. The banner renders once the
    // member's spaces query resolves.
    space.verifySpaceInviteBannerVisible(spaceName)
    space.acceptInvite(spaceName, newInviteName)
    main.verifyElementByTextExists(space.acceptInviteConfirmationMsg(spaceName))

    // Clean up: the invitee is only a member and cannot delete the workspace, so sign back in as the
    // admin who created it and remove it — keeping the run idempotent (tests 1 and 2 self-clean too).
    space.disconnectFromSpaceLevel()
    cy.clearAllCookies()
    space.visitSpacesView()
    space.signInWithWallet(admin)
    space.deleteSpace(spaceName)
  })
})
