import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as space from '../pages/spaces.page.js'
import * as navigation from '../pages/navigation.page'

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
    const spaceName = 'Space_' + Math.random().toString(36).substring(2, 12)
    const newSpaceName = 'Renamed Space'

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.deleteAllSpaces()
    main.verifyElementsIsVisible([space.createSpaceBtn])
    space.createSpace(spaceName)
    space.clickOnSpaceSelector(spaceName)
    space.spaceExists(spaceName)
    space.goToSpaceSettings()
    space.editSpace(newSpaceName)
    space.clickOnSpaceSelector(newSpaceName)
    space.spaceExists(newSpaceName)
    space.deleteSpace(newSpaceName)
    cy.contains(space.deleteSpaceConfirmationMsg(newSpaceName)).should('be.visible')
    main.verifyElementsIsVisible([space.createSpaceBtn])
  })

  it('Verify an account can be added manually', () => {
    const spaceName = 'Space_' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.deleteAllSpaces()
    space.createSpace(spaceName)
    space.addAccountManually(staticSafes.SEP_STATIC_SAFE_35.substring(4), constants.networks.sepolia)
  })

  it('Verify a new member can be invited and accept the invite', () => {
    const spaceName = 'Space_' + Math.random().toString(36).substring(2, 12)
    const memberName = 'Member_' + Math.random().toString(36).substring(2, 12)
    const newInviteName = 'Invited_memeber_' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    space.clickOnSignInBtn()
    space.deleteAllSpaces()
    space.createSpace(spaceName)
    space.goToSpaceMembers()
    space.addMember(memberName, user_address)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(user)
    space.clickOnSignInBtn()
    cy.reload() // Required to trigger the invite
    space.acceptInvite(newInviteName)
  })
})
