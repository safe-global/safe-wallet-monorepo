import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as addressBook from '../pages/address_book.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import * as org from '../pages/organizations.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as navigation from '../pages/navigation.page'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const admin = walletCredentials.OWNER_4_PRIVATE_KEY
const user = walletCredentials.OWNER_3_PRIVATE_KEY
const user_address = walletCredentials.OWNER_3_WALLET_ADDRESS

describe.skip('Basic flow organizations tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_31)
    main.verifyElementsIsVisible([org.orgList])
  })

  it('Verify a user can sign in, create, rename and delete an organisation', () => {
    const orgName = 'Org_' + Math.random().toString(36).substring(2, 12)
    const newOrgName = 'Renamed Organization'

    wallet.connectSigner(admin)
    org.clickOnSignInBtn()

    org.createOrganization(orgName)
    org.clickOnOrgSelector(orgName)
    org.orgExists(orgName)

    org.goToOrgSettings()
    org.editOrganization(orgName, newOrgName)
    org.clickOnOrgSelector(orgName)
    org.orgExists(orgName)

    org.deleteOrganization(newOrgName)
  })

  it('Verify an account can be added manually', () => {
    const orgName = 'Org_' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    org.clickOnSignInBtn()

    org.createOrganization(orgName)
    org.addAccountManually(staticSafes.SEP_STATIC_SAFE_35.substring(4))

  })

  it('Verify a new member can be invited and accept the invite', () => {
    const orgName = 'Org_' + Math.random().toString(36).substring(2, 12)
    const memberName = 'Member_' + Math.random().toString(36).substring(2, 12)

    wallet.connectSigner(admin)
    org.clickOnSignInBtn()

    org.createOrganization(orgName)
    org.goToOrgMembers()

    org.addMember(memberName, user_address)

    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()

    wallet.connectSigner(user)
    org.clickOnSignInBtn()



  })
})
