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
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(main.generateRandomString(10))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    owner.typeOwnerAddress(constants.addresBookContacts.user1.address.toUpperCase())
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddress(staticSafes.SEP_STATIC_SAFE_4)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownSafe)

    owner.typeOwnerAddress(constants.addresBookContacts.user1.address.replace('F', 'f'))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    owner.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.alreadyAdded)
  })

  it('[SMOKE] Verify the presence of "Add Owner" button', () => {
    wallet.connectSigner(signer)
    owner.verifyAddOwnerBtnIsEnabled()
  })

  it('[SMOKE] Verify “Add new owner” button is disabled for Non-Owner', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3)
    main.waitForHistoryCallToComplete()
    owner.verifyAddOwnerBtnIsDisabled()
  })
})
