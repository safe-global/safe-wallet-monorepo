import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as wallet from '../../support/utils/wallet.js'
import { walletCredentials } from '../../support/credentials.js'

let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Safe creation tests', () => {
  beforeEach(() => {
    createwallet.startCreateSafeFlow(signer)
  })

  // TODO: Replace wallet with Safe
  // TODO: Check unit tests
  it('Verify there is no error message is displayed if wallet name input contains less than 50 characters', () => {
    createwallet.typeWalletName(main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  // TODO: Check unit tests
  it('Verify there is no error message is displayed if owner name input contains less than 50 characters', () => {
    owner.typeExistingOwnerName(main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  it('Verify data persistence', () => {
    const ownerName = 'David'
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
    createwallet.verifyOwnerAddressInSummaryStep(constants.defaultOwnerAddress())
    createwallet.verifyOwnerAddressInSummaryStep(constants.defaultOwnerAddress())
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifySafeNetworkNameInSummaryStep(constants.networks.sepolia.toLowerCase())
    createwallet.clickOnBackBtn()
    createwallet.clickOnBackBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.verifySafeNameInSummaryStep(createwallet.walletName)
    createwallet.verifyOwnerNameInSummaryStep(ownerName)
    createwallet.verifyOwnerAddressInSummaryStep(constants.defaultOwnerAddress())
    createwallet.verifyOwnerAddressInSummaryStep(constants.defaultOwnerAddress())
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifySafeNetworkNameInSummaryStep(constants.networks.sepolia.toLowerCase())
  })

  it('Verify tip is displayed on right side for threshold 1/1', () => {
    createwallet.clickOnNextBtn()
    createwallet.verifyPolicy1_1()
  })

  it('Verify Next button is disabled until switching to network is done', () => {
    createwallet.verifyNextBtnIsEnabled()
    createwallet.clearNetworkInput(1)
    createwallet.verifyNextBtnIsDisabled()
  })
})
