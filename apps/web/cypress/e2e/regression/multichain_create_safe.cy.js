import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createwallet from '../pages/create_wallet.pages'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as owner from '../pages/owners.pages'
import { getMockAddress } from '../../support/utils/ethers.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Multichain safe creation tests', () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    cy.wait(2000)
    wallet.connectSigner(signer)
  })

  it('Verify that Pay now is not available for the multichain safe creation', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    main.verifyElementsCount(createtx.payNowExecMethod, 0)
  })

  it('Verify that Pay now is available for single safe creation', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clearNetworkInput(1)
    createwallet.enterNetwork(1, constants.networks.polygon)
    createwallet.clickOnNetwrokCheckbox()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    main.verifyElementsCount(createtx.payNowExecMethod, 1)
  })

  it('Verify that Relay is available for one safe creation', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clearNetworkInput(1)
    createwallet.enterNetwork(1, constants.networks.polygon)
    createwallet.clickOnNetwrokCheckbox()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    tx.selectRelayOtion()
    cy.contains(tx.relayRemainingAttemptsStr).should('exist')
  })

  it('Verify that multichain safe creation is available with 2/2 setup', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnNextBtn()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressCreateSafeStep(1, getMockAddress())
    owner.clickOnThresholdDropdown()
    owner.getThresholdOptions().eq(1).click()
    createwallet.clickOnNextBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.clickOnLetsGoBtn().then(() => {
      let data = localStorage.getItem(constants.localStorageKeys.SAFE_v2__undeployedSafes)
      createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.polygon, 2, 2, data)
      createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.sepolia, 2, 2, data)
    })
  })

  it('Verify that multichain safe creation is available for 1/2 set up', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnNextBtn()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressCreateSafeStep(1, getMockAddress())
    owner.clickOnThresholdDropdown()
    owner.getThresholdOptions().eq(0).click()
    createwallet.clickOnNextBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.clickOnLetsGoBtn().then(() => {
      let data = localStorage.getItem(constants.localStorageKeys.SAFE_v2__undeployedSafes)
      createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.polygon, 1, 2, data)
      createwallet.assertCFSafeThresholdAndSigners(constants.networkKeys.sepolia, 1, 2, data)
    })
  })
})
