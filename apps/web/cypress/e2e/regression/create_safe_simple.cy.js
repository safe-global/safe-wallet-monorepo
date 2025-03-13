import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as ls from '../../support/localstorage_data.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Safe creation tests', () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
  })

  // TODO: Check unit tests
  it('Verify error message is displayed if wallet name input exceeds 50 characters', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.typeWalletName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
    createwallet.clearWalletName()
  })

  // TODO: Replace wallet with Safe
  // TODO: Check unit tests
  it('Verify there is no error message is displayed if wallet name input contains less than 50 characters', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.typeWalletName(main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  it('Verify current connected account is shown as default owner', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNextBtn()
    owner.verifyExistingOwnerAddress(0, constants.DEFAULT_OWNER_ADDRESS)
  })

  // TODO: Check unit tests
  it('Verify error message is displayed if owner name input exceeds 50 characters', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    owner.typeExistingOwnerName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
  })

  // TODO: Check unit tests
  it('Verify there is no error message is displayed if owner name input contains less than 50 characters', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    owner.typeExistingOwnerName(main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  it('Verify data persistence', () => {
    const ownerName = 'David'
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    createwallet.typeOwnerName(ownerName, 1)
    createwallet.typeOwnerAddress(constants.SEPOLIA_OWNER_2, 1)
    createwallet.clickOnBackBtn()
    createwallet.clearWalletName()
    createwallet.typeWalletName(createwallet.walletName)
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.verifySafeNameInSummaryStep(createwallet.walletName)
    createwallet.verifyOwnerNameInSummaryStep(ownerName)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifySafeNetworkNameInSummaryStep(constants.networks.sepolia.toLowerCase())
    createwallet.clickOnBackBtn()
    createwallet.clickOnBackBtn()
    cy.wait(1000)
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.verifySafeNameInSummaryStep(createwallet.walletName)
    createwallet.verifyOwnerNameInSummaryStep(ownerName)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifySafeNetworkNameInSummaryStep(constants.networks.sepolia.toLowerCase())
  })

  it('Verify tip is displayed on right side for threshold 1/1', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNextBtn()
    createwallet.verifyPolicy1_1()
  })

  // TODO: Check unit tests
  it('Verify address input validation rules', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    createwallet.typeOwnerAddress(main.generateRandomString(10), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    createwallet.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownerAdded)

    createwallet.typeOwnerAddress(getMockAddress().replace('A', 'a'), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    createwallet.typeOwnerAddress(constants.ENS_TEST_SEPOLIA_INVALID, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.failedResolve)
  })

  it('Verify duplicated signer error using the autocomplete feature', () => {
    cy.visit(constants.createNewSafeSepoliaUrl + '?chain=sep')
    cy.wrap(null)
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sameOwnerName),
      )
      .then(() => {
        cy.reload()
        createwallet.waitForConnectionMsgDisappear()
        createwallet.selectMultiNetwork(1, constants.networks.sepolia.toLowerCase())
        createwallet.clickOnNextBtn()
        createwallet.clickOnAddNewOwnerBtn()
        createwallet.clickOnSignerAddressInput(1)
        main.verifyMinimumElementsCount(createwallet.addressAutocompleteOptions, 2)
        createwallet.selectSignerOnAutocomplete(2)
        owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownerAdded)
      })
  })

  // Unskip when the bug is fixed
  it.skip('Verify Next button is disabled until switching to network is done', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.verifyNextBtnIsEnabled()
    createwallet.clearNetworkInput(1)
    createwallet.verifyNextBtnIsDisabled()
  })
})
