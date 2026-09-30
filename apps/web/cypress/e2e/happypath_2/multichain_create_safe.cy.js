import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createwallet from '../pages/create_wallet.pages'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as owner from '../pages/owners.pages'
import * as navigation from '../pages/navigation.page.js'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

// The networks selected in the creation flow below, in selection order.
const selectedChainIds = ['11155111', '1', '137'] // sepolia, ethereum, polygon

// true if a <= b, comparing major, then minor, then patch
const isLowerOrEqualVersion = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number))
  return (x[0] - y[0] || x[1] - y[1] || x[2] - y[2]) <= 0
}

// Same rule as the app (getLatestSafeVersion in packages/utils/src/utils/chains.ts):
// use the FIRST selected network's recommendedMasterCopyVersion, but never a version
// newer than what safe-deployments ships. Other networks can't lower the version —
// networks that don't support it just can't be selected.
const getExpectedMultichainVersion = () => {
  const firstSelectedChainId = selectedChainIds[0]
  return cy
    .request(`${constants.stagingCGWUrlv1}${constants.stagingCGWChains}${firstSelectedChainId}`)
    .its('body.recommendedMasterCopyVersion')
    .then((recommended) => {
      const deployed = getSafeSingletonDeployment({ network: firstSelectedChainId, released: true })?.version
      return deployed && isLowerOrEqualVersion(deployed, recommended) ? deployed : recommended
    })
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
