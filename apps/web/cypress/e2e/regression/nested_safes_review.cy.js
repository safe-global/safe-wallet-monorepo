import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
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
    // Set large viewport to ensure modal content is fully visible
    cy.viewport(1400, 1200)
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_45)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.nestedParentSafe45)
    cy.reload()
    wallet.connectSigner(signer)
    sideBar.clickOnOpenNestedSafeListBtn()
    // This safe has no existing nested safes, so no intro screen - just click add
    nsafes.clickOnAddNestedSafeBtn()
  })

  it('Verify middle step with Fund new assets in create nestedsafe tx flow', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setMaxAmountValue(0)
    nsafes.clickOnAddNextBtn()
    nsafes.actionsExist(nsafes.fundAssetsActions)
    createTx.clickOnAdvancedDetails()
    createTx.verifytxAccordionDetailsScroll(createTx.MultisendData)
  })

  it('Verify middle step without Fund new assets in create nestedsafe tx flow', () => {
    nsafes.clickOnAddNextBtn()
    nsafes.actionsExist(nsafes.nonfundAssetsActions)
    createTx.clickOnAdvancedDetails()
    createTx.verifytxAccordionDetailsScroll(createTx.SafeProxy)
  })
})
