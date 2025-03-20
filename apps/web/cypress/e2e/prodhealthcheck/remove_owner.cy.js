import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../pages/owners.pages'
import * as createwallet from '../pages/create_wallet.pages'
import * as createTx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { acceptCookies2 } from '../pages/main.page.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[PROD] Remove Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13)
    main.waitForHistoryCallToComplete()
    acceptCookies2()
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
  })

  // Unskip after next release
  it.skip('Verify owner deletion transaction has been created', () => {
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
    owner.openRemoveOwnerWindow(1)
    cy.wait(3000)
    createwallet.clickOnNextBtn()
    //This method creates the @removedAddress alias
    owner.getAddressToBeRemoved()
    owner.verifyOwnerDeletionWindowDisplayed()
    createTx.changeNonce(10)
    createTx.clickOnSignTransactionBtn()
    createTx.waitForProposeRequest()
    createTx.clickViewTransaction()
    createTx.clickOnTransactionItemByName('removeOwner')
    createTx.verifyTxDestinationAddress('@removedAddress')
  })
})
