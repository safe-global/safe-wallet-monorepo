import * as batch from '../pages/batches.pages'
import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as owner from '../../e2e/pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as ls from '../../support/localstorage_data.js'
import * as navigation from '../pages/navigation.page.js'
import { getMockAddress } from '../../support/utils/ethers.js'

const currentNonce = 3
const funds_first_tx = '0.001'
const funds_second_tx = '0.002'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_PRIVATE_KEY

describe('Batch transaction tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
  })

  it('Verify the Add batch button is present in a transaction form', () => {
    //The "true" is to validate that the add to batch button is not visible if "Yes, execute" is selected
    batch.addNewTransactionToBatch(getMockAddress(), currentNonce, funds_first_tx)
  })

  it('Verify a second transaction can be added to the batch', () => {
    batch.addNewTransactionToBatch(getMockAddress(), currentNonce, funds_first_tx)
    cy.wait(1000)
    batch.addNewTransactionToBatch(getMockAddress(), currentNonce, funds_first_tx)
    batch.verifyBatchIconCount(2)
    batch.clickOnBatchCounter()
    batch.verifyAmountTransactionsInBatch(2)
  })

  it('Verify that clicking on "Confirm batch" button opens confirm batch modal with listed transactions', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0)
    cy.reload()
    batch.clickOnBatchCounter()
    batch.clickOnConfirmBatchBtn()
    cy.contains(funds_first_tx).parents('ul').as('TransactionList')
    cy.get('@TransactionList').find('li').eq(0).contains(funds_first_tx)
    cy.get('@TransactionList').find('li').eq(1).contains(funds_second_tx)
    cy.contains(batch.addToBatchBtn).should('have.length', 0)
  })

  it('Verify the "New transaction" button in Add batch modal is enabled/disabled for different users types', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer)
    batch.openBatchtransactionsModal()
    batch.verifyNewTxButtonStatus(constants.enabledStates.enabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    owner.waitForConnectionStatus()
    batch.verifyNewTxButtonStatus(constants.enabledStates.disabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    batch.verifyNewTxButtonStatus(constants.enabledStates.disabled)
  })

  it('Verify a batched tx can be expanded and collapsed', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0)
    cy.reload()
    batch.clickOnBatchCounter()
    cy.contains(funds_first_tx).parents('ul').as('TransactionList')
    cy.get('@TransactionList').find('li').eq(0).contains(funds_first_tx).click()
    batch.isTxExpanded(0, true)
    cy.get('@TransactionList').find('li').eq(0).contains(funds_first_tx).click()
    batch.isTxExpanded(0, false)
  })

  it('Verify that the Add batch button is not present on non-safe pages', () => {
    const urls = [constants.welcomeUrl, constants.appSettingsUrl, constants.appsUrl]

    urls.forEach((url) => {
      cy.visit(url)
      cy.get(batch.batchTxTopBar).should('not.exist')
    })
  })

  it('Verify a transaction can be added to the batch', () => {
    wallet.connectSigner(signer)
    batch.addNewTransactionToBatch(constants.EOA, currentNonce, funds_first_tx)
    batch.verifyBatchIconCount(1)
    batch.clickOnBatchCounter()
    batch.verifyAmountTransactionsInBatch(1)
  })

  it('Verify a transaction can be removed from the batch', () => {
    cy.wrap(null)
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0))
      .then(() => main.isItemInLocalstorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry0))
      .then(() => {
        cy.reload()
        wallet.connectSigner(signer)
        batch.clickOnBatchCounter()
        cy.contains(batch.batchedTransactionsStr).should('be.visible').parents('aside').find('ul > li').as('BatchList')
        cy.get('@BatchList').find(batch.deleteTransactionbtn).eq(0).click()
        cy.get('@BatchList').should('have.length', 1)
        cy.get('@BatchList').contains(funds_first_tx).should('not.exist')
      })
  })
})
