import * as batch from '../pages/batches.pages'
import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const currentNonce = 3
const funds_first_tx = '0.001'
const funds_second_tx = '0.002'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Batch transaction tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[SMOKE] Verify empty batch list can be opened', () => {
    batch.openBatchtransactionsModal()
    cy.contains(batch.addInitialTransactionStr).should('be.visible')
  })

  it('[SMOKE] Verify a transaction is visible in a batch', () => {
    cy.wrap(null)
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry1))
      .then(() => {
        cy.reload()
        batch.verifyBatchIconCount(1)
        batch.clickOnBatchCounter()
        batch.verifyAmountTransactionsInBatch(1)
      })
  })

  it('[SMOKE] Verify the batch can be confirmed and related transactions exist in the form', () => {
    cy.wrap(null)
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0))
      .then(() => main.isItemInLocalstorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0))
      .then(() => {
        cy.reload()
        wallet.connectSigner(signer)
        batch.clickOnBatchCounter()
        batch.clickOnConfirmBatchBtn()
        batch.verifyBatchTransactionsCount(2)
        batch.clickOnBatchCounter()
        cy.contains(funds_first_tx).parents('ul').as('TransactionList')
        cy.get('@TransactionList').find('li').eq(0).contains(funds_first_tx)
        cy.get('@TransactionList').find('li').eq(1).contains(funds_second_tx)
      })
  })
})
