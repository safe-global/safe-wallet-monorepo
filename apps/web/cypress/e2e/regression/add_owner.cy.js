import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../pages/owners.pages'
import * as addressBook from '../pages/address_book.page'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Add Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Disconnected', () => {
    beforeEach(() => {
      cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    })

    // Added to prod
    it('Verify add owner button is disabled for disconnected user', () => {
      owner.verifyManageSignersBtnIsDisabled()
    })
  })

  describe('Connected', () => {
    beforeEach(() => {
      wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    })

    // Added to prod
    it('Verify the Add New Owner Form can be opened', () => {
      owner.openManageSignersWindow()
    })

    it('Verify error message displayed if character limit is exceeded in Name input', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerNameManage(1, main.generateRandomString(51))
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
    })

    //The case should be updated with review "Add owner" field on next page and other options
    it('Verify that Name field not mandatory', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerAddressManage(1, getMockAddress())
      owner.clickOnNextBtnManage()
      owner.verifyConfirmTransactionWindowDisplayed()
    })

    it('Verify default threshold value. Verify correct threshold calculation', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerAddressManage(1, constants.DEFAULT_OWNER_ADDRESS)
      owner.verifyThreshold(1, 2)
    })

    //TBD the case should be updated with additional steps to verify a new owner address and name
    it('Verify valid Address validation', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerAddressManage(1, constants.SEPOLIA_OWNER_2)
      owner.clickOnNextBtnManage()
      owner.verifyConfirmTransactionWindowDisplayed()
      owner.clickOnBackBtn()
      owner.typeOwnerAddressManage(1, staticSafes.SEP_STATIC_SAFE_3)
      owner.clickOnNextBtnManage()
      owner.verifyConfirmTransactionWindowDisplayed()
    })
  })

  describe('Address book autofill', () => {
    it('Verify that the "Name" field is auto-filled with the relevant name from Address Book', () => {
      cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
      addressBook.clickOnCreateEntryBtn()
      addressBook.typeInName(constants.addresBookContacts.user1.name)
      addressBook.typeInAddress(constants.addresBookContacts.user1.address)
      addressBook.clickOnSaveEntryBtn()
      addressBook.verifyNewEntryAdded(
        constants.addresBookContacts.user1.name,
        constants.addresBookContacts.user1.address,
      )
      wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerAddressManage(1, constants.addresBookContacts.user1.address)
      owner.verifyNewOwnerName(1, constants.addresBookContacts.user1.name)
    })
  })
})
