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

// The networks selected in the creation flow below. A multichain safe is created at the
// lowest recommendedMasterCopyVersion across the selected networks, so the expected
// version comes from the same config the app reads (staging CGW) instead of a hardcode.
const selectedChainIds = ['11155111', '1', '137'] // sepolia, ethereum, polygon

const getExpectedMultichainVersion = () => {
  const lower = (a, b) => {
    const [x, y] = [a.split('.').map(Number), b.split('.').map(Number)]
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? a : b
    return a
  }
  let expected
  selectedChainIds.forEach((chainId) => {
    cy.request(constants.stagingCGWUrlv1 + constants.stagingCGWChains + chainId).then(({ body }) => {
      expected = expected ? lower(expected, body.recommendedMasterCopyVersion) : body.recommendedMasterCopyVersion
    })
  })
  return cy.then(() => expected)
}

describe('Happy path Multichain safe creation tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    createwallet.startCreateSafeFlow(signer)
  })

  it('Verify that L2 safe created during multichain safe creation has the recommended L2 contract after deployment', () => {
    createwallet.clickOnNetwrokRemoveIcon()
    createwallet.selectMultiNetwork(1, constants.networks.sepolia.toLowerCase())
    createwallet.selectMultiNetwork(1, constants.networks.ethereum.toLowerCase())
    createwallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    createwallet.clickOnYourSafeAccountPreview()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnSignInToWorkspaceBtn()
    createwallet.clickOnReviewStepNextBtn()
    createwallet.clickOnLetsGoBtn()

    cy.url().then((currentUrl) => {
      const safe = `sep:${main.getSafeAddressFromUrl(currentUrl)}`
      createwallet.clickOnActivateAccountBtn(0)
      createwallet.selectPayNowOption()
      createwallet.clickOnFinalActivateAccountBtn()
      createwallet.clickOnLetsGoBtn()
      cy.visit(constants.setupUrl + safe)
      getExpectedMultichainVersion().then((version) => {
        main.verifyValuesExist(navigation.setupSection, [`${version}+L2`])
      })
    })
  })
})
