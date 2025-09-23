import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createwallet from '../pages/create_wallet.pages.js'
import * as owner from '../pages/owners.pages.js'
import { getMockAddress } from '../../support/utils/ethers.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Multichain safe creation flow tests', () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    cy.wait(2000)
    wallet.connectSigner(signer)
  })

  it('Verify Review screen for multichain safe creation flow', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    main.verifyElementsExist([
      createwallet.payNowLaterMessageBox,
      createwallet.safeSetupOverview,
      createwallet.networksLogoList,
      createwallet.reviewStepOwnerInfo,
      createwallet.reviewStepSafeName,
      createwallet.reviewStepThreshold,
      createwallet.reviewStepNextBtn,
    ])
    createwallet.checkNetworkLogoInReviewStep([constants.networkKeys.polygon, constants.networkKeys.sepolia])
  })

  it('Verify that selected networks are displayed in preview multichain safe', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.checkNetworkLogoInReviewStep([constants.networkKeys.polygon, constants.networkKeys.sepolia])
  })

  it('Verify Success safe creation screen for multichain creation', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressCreateSafeStep(1, getMockAddress())
    createwallet.clickOnNextBtn()
    createwallet.clickOnReviewStepNextBtn()
    main.verifyElementsExist([createwallet.cfSafeActivationMsg, createwallet.cfSafeCreationSuccessMsg])
    createwallet.checkNetworkLogoInSafeCreationModal([constants.networkKeys.polygon, constants.networkKeys.sepolia])
    createwallet.clickOnLetsGoBtn()
  })
})
