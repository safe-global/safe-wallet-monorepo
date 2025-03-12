import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../pages/owners.pages'
import * as createwallet from '../pages/create_wallet.pages'
import * as createTx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Remove Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13)
    main.waitForHistoryCallToComplete()
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
  })

  it('Verify that "Remove" icon is visible', () => {
    owner.verifyRemoveBtnIsEnabled().should('have.length', 2)
  })

  it('Verify remove button does not exist for Non-Owner when there is only 1 owner in the safe', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3)
    main.waitForHistoryCallToComplete()
    main.verifyElementsCount(owner.removeOwnerBtn, 0)
  })

  it('Verify remove owner button is disabled for disconnected user', () => {
    owner.verifyRemoveBtnIsDisabled()
  })

  it('Verify owner removal form can be opened', () => {
    wallet.connectSigner(signer)
    owner.openRemoveOwnerWindow(1)
  })

  it('Verify threshold input displays the upper limit as the current safe number of owners minus one', () => {
    wallet.connectSigner(signer)
    owner.openRemoveOwnerWindow(1)
    owner.verifyThresholdLimit(1, 1)
    owner.getThresholdOptions().should('have.length', 1)
  })

  // Added to prod
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
