import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Nested safes review step tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_45)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.clickOnAddNestedSafeBtn()
  })

  it('Verify review step with Fund new assets', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setMaxAmountValue(0)
    nsafes.clickOnAddNextBtn()
    createTx.clickOnNoLaterOption()
    nsafes.actionsExist(nsafes.fundAssetsActions)
    nsafes.checkAddTobatchBtnStatus(constants.enabledStates.disabled)
  })

  it('Verify review step without Fund new assets', () => {
    nsafes.clickOnAddNextBtn()
    nsafes.clickOnAdvancedDetails()
    createTx.clickOnNoLaterOption()
    nsafes.actionsExist(nsafes.nonfundAssetsActions)
    nsafes.checkAddTobatchBtnStatus(constants.enabledStates.enabled)
  })
})
