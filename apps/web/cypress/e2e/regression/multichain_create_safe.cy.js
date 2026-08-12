import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createwallet from '../pages/create_wallet.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as owner from '../pages/owners.pages'
import { getMockAddress } from '../../support/utils/ethers.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Multichain safe creation tests', () => {
  beforeEach(() => {
    main.blockBeamer()
    createwallet.startCreateSafeFlow(signer)
  })

  it('Verify that Pay now is not available for the multichain safe creation', () => {
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createtx.verifyPayNowOptionIsDisabled()
  })

  it('Verify that Pay now is available for single safe creation', () => {
    createwallet.clearNetworkInput(1)
    createwallet.enterNetwork(1, constants.networks.polygon)
    createwallet.clickOnNetwrokCheckbox()
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    main.verifyElementsCount(createtx.payNowExecMethod, 1)
  })

  it('Verify that Relay is available for one safe creation', () => {
    createwallet.clearNetworkInput(1)
    createwallet.enterNetwork(1, constants.networks.sepolia)
    createwallet.clickOnNetwrokCheckbox()
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    tx.selectRelayOtion()
    // The remaining-relays counter is hidden on GTF (unlimited relay) chains, so assert the
    // relay option itself is selected instead.
    tx.verifyRelayExecutionMethodChecked()
  })

  it('Verify that multichain safe creation is available with 2/2 setup', () => {
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressCreateSafeStep(1, getMockAddress())
    owner.clickOnThresholdDropdown()
    owner.selectThresholdOption(1)
    createwallet.clickOnNextBtn()
    createwallet.clickOnSignInToWorkspaceBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.getCreatedSafeAddress().then((safeAddress) => {
      createwallet.clickOnLetsGoBtn().then(() => {
        let data = localStorage.getItem(constants.localStorageKeys.SAFE_v2__undeployedSafes)
        createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.polygon, 2, 2, data, safeAddress)
        createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.sepolia, 2, 2, data, safeAddress)
      })
    })
  })

  it('Verify that multichain safe creation is available for 1/2 set up', () => {
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressCreateSafeStep(1, getMockAddress())
    owner.clickOnThresholdDropdown()
    owner.selectThresholdOption(0)
    createwallet.clickOnNextBtn()
    createwallet.clickOnSignInToWorkspaceBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.getCreatedSafeAddress().then((safeAddress) => {
      createwallet.clickOnLetsGoBtn().then(() => {
        let data = localStorage.getItem(constants.localStorageKeys.SAFE_v2__undeployedSafes)
        createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.polygon, 1, 2, data, safeAddress)
        createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.sepolia, 1, 2, data, safeAddress)
      })
    })
  })
})
