import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createwallet from '../pages/create_wallet.pages'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as owner from '../pages/owners.pages'
import * as navigation from '../pages/navigation.page.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Happy path Multichain safe creation tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    cy.wait(2000)
    wallet.connectSigner(signer)
  })

  it('Verify that L2 safe created during multichain safe creation has 1.4.1 L2 contract after deployment', () => {
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNetwrokRemoveIcon()
    createwallet.selectMultiNetwork(1, constants.networks.ethereum.toLowerCase())
    createwallet.selectMultiNetwork(1, constants.networks.sepolia.toLowerCase())
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.clickOnLetsGoBtn()

    cy.url().then((currentUrl) => {
      const safe = `sep:${main.getSafeAddressFromUrl(currentUrl)}`
      cy.visit(constants.homeUrl + safe)
      createwallet.clickOnActivateAccountBtn(0)
      createwallet.selectPayNowOption()
      createwallet.clickOnFinalActivateAccountBtn()
      createwallet.clickOnLetsGoBtn()
      cy.visit(constants.setupUrl + safe)
      main.verifyValuesExist(navigation.setupSection, [constants.safeContractVersions.v1_4_1_L2])
    })
  })
})
