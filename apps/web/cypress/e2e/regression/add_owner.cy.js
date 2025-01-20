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

  beforeEach(() => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
  })

  // Added to prod
  it('Verify add owner button is disabled for disconnected user', () => {
    owner.verifyAddOwnerBtnIsDisabled()
  })

  // Added to prod
  it('Verify the Add New Owner Form can be opened', () => {
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
  })

  it('Verify error message displayed if character limit is exceeded in Name input', () => {
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
    owner.typeOwnerName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
  })

  it('Verify that the "Name" field is auto-filled with the relevant name from Address Book', () => {
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
    addressBook.clickOnCreateEntryBtn()
    addressBook.typeInName(constants.addresBookContacts.user1.name)
    addressBook.typeInAddress(constants.addresBookContacts.user1.address)
    addressBook.clickOnSaveEntryBtn()
    addressBook.verifyNewEntryAdded(constants.addresBookContacts.user1.name, constants.addresBookContacts.user1.address)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.addresBookContacts.user1.address)
    owner.verifyNewOwnerName(constants.addresBookContacts.user1.name)
  })

  it('Verify that Name field not mandatory', () => {
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(getMockAddress())
    owner.clickOnNextBtn()
    owner.verifyConfirmTransactionWindowDisplayed()
  })

  it('Verify default threshold value. Verify correct threshold calculation', () => {
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS)
    owner.verifyThreshold(1, 2)
  })

  it('Verify valid Address validation', () => {
    wallet.connectSigner(signer)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtn()
    owner.verifyConfirmTransactionWindowDisplayed()
    owner.clickOnBackBtn()
    owner.typeOwnerAddress(staticSafes.SEP_STATIC_SAFE_3)
    owner.clickOnNextBtn()
    owner.verifyConfirmTransactionWindowDisplayed()
  })
})
