import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../pages/owners.pages'
import * as navigation from '../pages/navigation.page'
import * as wallet from '../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Add Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.waitForHistoryCallToComplete()
    main.verifyElementsExist([navigation.setupSection])
  })

  // TODO: Check if this test is covered with unit tests
  it('[SMOKE] Verify relevant error messages are displayed in Address input', () => {
    wallet.connectSigner(signer)
    owner.openManageSignersWindow()
    owner.clickOnAddSignerBtn()

    owner.typeOwnerAddressManage(1, main.generateRandomString(10))

    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    owner.typeOwnerAddressManage(1, constants.addresBookContacts.user1.address.toUpperCase())
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddressManage(1, staticSafes.SEP_STATIC_SAFE_4)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownSafeManage)

    owner.typeOwnerAddressManage(1, constants.addresBookContacts.user1.address.replace('F', 'f'))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddressManage(1, constants.DEFAULT_OWNER_ADDRESS)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownerAdded)
  })

  it('[SMOKE] Verify the presence of "Manage Signers" button', () => {
    wallet.connectSigner(signer)
    owner.verifyManageSignersBtnIsEnabled()
  })

  it('[SMOKE] Verify "Manage Signers" button is disabled for Non-Owner', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3)
    main.waitForHistoryCallToComplete()
    owner.verifyManageSignersBtnIsDisabled()
  })
})
