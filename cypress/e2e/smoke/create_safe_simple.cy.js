import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'

import * as owner from '../pages/owners.pages'

describe('Create Safe tests', () => {
  beforeEach(() => {
    cy.visit(constants.createNewSafeSepoliaUrl)
    cy.clearLocalStorage()
    main.acceptCookies()
  })

  it('C55742: Verify a Wallet can be connected', () => {
    owner.waitForConnectionStatus()
    cy.visit(constants.welcomeUrl)
    owner.clickOnWalletExpandMoreIcon()
    owner.clickOnDisconnectBtn()
    createwallet.clickOnCreateNewSafeBtn()
    owner.clickOnConnectBtn()
    createwallet.connectWallet()
  })

  it('C55743: Verify Next button is disabled until switching to network is done', () => {
    owner.waitForConnectionStatus()
    createwallet.selectNetwork(constants.networks.ethereum)
    createwallet.checkNetworkChangeWarningMsg()
    createwallet.verifyNextBtnIsDisabled()
    createwallet.selectNetwork(constants.networks.sepolia)
    createwallet.verifyNextBtnIsEnabled()
  })

  it('C32378: Verify that a new Wallet has default name related to the selected network', () => {
    owner.waitForConnectionStatus()
    createwallet.verifyDefaultWalletName(createwallet.defaltSepoliaPlaceholder)
  })

  it('C4790: Verify error message is displayed if wallet name input exceeds 50 characters', () => {
    owner.waitForConnectionStatus()
    createwallet.typeWalletName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
  })

  it('C55744: Verify there is no error message is displayed if wallet name input contains less than 50 characters', () => {
    owner.waitForConnectionStatus()
    createwallet.typeWalletName(main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  it('C852: Verify current connected account is shown as default owner', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    owner.verifyExistingOwnerAddress(0, constants.DEFAULT_OWNER_ADDRESS)
  })

  it('C4791: Verify error message is displayed if owner name input exceeds 50 characters', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    owner.typeExistingOwnerName(0, main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
  })

  it('C55745: Verify there is no error message is displayed if owner name input contains less than 50 characters', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    owner.typeExistingOwnerName(0, main.generateRandomString(50))
    owner.verifyValidWalletName(constants.addressBookErrrMsg.exceedChars)
  })

  it('C55746: Verify Add and Remove Owner Row works as expected', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    owner.verifyNumberOfOwners(2)
    owner.verifyExistingOwnerAddress(1, '')
    owner.verifyExistingOwnerName(1, '')
    createwallet.removeOwner(0)
    main.verifyElementsCount(createwallet.removeOwnerBtn, 0)
    createwallet.clickOnAddNewOwnerBtn()
    owner.verifyNumberOfOwners(2)
  })

  it('C55748: Verify Threshold Setup', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    owner.verifyNumberOfOwners(2)
    createwallet.clickOnAddNewOwnerBtn()
    owner.verifyNumberOfOwners(3)
    owner.verifyThresholdLimit(1, 3)
    createwallet.updateThreshold(3)
    createwallet.removeOwner(1)
    owner.verifyThresholdLimit(1, 2)
  })

  it('C55749: Verify data persistence', () => {
    const ownerName = 'David'
    owner.waitForConnectionStatus()
    createwallet.typeWalletName(createwallet.walletName)
    owner.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    createwallet.typeOwnerName(ownerName, 1)
    createwallet.typeOwnerAddress(constants.SEPOLIA_OWNER_2, 1)
    owner.verifyThresholdLimit(1, 2)
    owner.clickOnNextBtn()
    createwallet.verifySafeNameInSummaryStep(createwallet.walletName)
    createwallet.verifyOwnerNameInSummaryStep(ownerName)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifyNetworkInSummaryStep(constants.networks.sepolia)
    owner.clickOnBackBtn()
    owner.clickOnBackBtn()
    cy.wait(1000)
    owner.clickOnNextBtn()
    owner.clickOnNextBtn()
    createwallet.verifySafeNameInSummaryStep(createwallet.walletName)
    createwallet.verifyOwnerNameInSummaryStep(ownerName)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyOwnerAddressInSummaryStep(constants.DEFAULT_OWNER_ADDRESS)
    createwallet.verifyThresholdStringInSummaryStep(1, 2)
    createwallet.verifyNetworkInSummaryStep(constants.networks.sepolia)
    createwallet.verifyEstimatedFeeInSummaryStep()
  })

  it('C55750: Verify tip is displayed on right side for threshold 1/1', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    createwallet.verifyPolicy1_1()
  })

  it('C55747: Verify address input validation rules', () => {
    owner.waitForConnectionStatus()
    owner.clickOnNextBtn()
    createwallet.clickOnAddNewOwnerBtn()
    createwallet.typeOwnerAddress(main.generateRandomString(10), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    createwallet.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownerAdded)

    createwallet.typeOwnerAddress(constants.DEFAULT_OWNER_ADDRESS.toUpperCase(), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    createwallet.typeOwnerAddress(constants.ENS_TEST_SEPOLIA_INVALID, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.failedResolve)
  })
})
