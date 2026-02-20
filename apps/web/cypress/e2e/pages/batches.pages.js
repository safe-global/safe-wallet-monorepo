import * as constants from '../../support/constants'
import * as main from './main.page'
import { clickOnContinueSignTransactionBtn, selectComboButtonOption, tokenSelector } from './create_tx.pages'

export const newTransactionBtnStr = 'New transaction'
const sendTokensButn = 'Send tokens'
export const addToBatchBtn = 'Add to batch'
const confirmBatchBtn = 'Confirm batch'
export const batchedTxs = 'Batched transactions'

export const closeModalBtnBtn = '[data-testid="CloseIcon"]'
export const deleteTransactionbtn = '[title="Delete transaction"]'
export const batchTxTopBar = '[data-track="batching: Batch sidebar open"]'
export const batchTxCounter = '[data-track="batching: Batch sidebar open"] span > span'
export const addNewTxBatch = '[data-track="batching: Add new tx to batch"]'
export const batchedTransactionsStr = 'Batched transactions'
export const addInitialTransactionStr = 'Add an initial transaction to the batch'
export const transactionAddedToBatchStr = 'Transaction is added to batch'
export const addNewStransactionStr = 'Add new transaction'
export const allActionsSection = '[data-testid="all-actions"]'
export const accordionActionItem = '[data-testid="action-item"]'

const recipientInput = 'input[name^="recipients."][name$=".recipient"]'
const listBox = 'ul[role="listbox"]'
const amountInput = 'input[name^="recipients."][name$=".amount"]'
const nonceInput = 'input[name="nonce"]'
const executeOptionsContainer = 'div[role="radiogroup"]'
const expandedItem = 'div[class*="MuiCollapse-entered"]'
const collapsedItem = 'div[class*="MuiCollapse-hidden"]'

export function addToBatch(EOA, currentNonce, amount) {
  fillTransactionData(EOA, amount)
  setNonceAndProceed(currentNonce)
  clickOnContinueSignTransactionBtn()

  selectComboButtonOption('addToBatch')

  addToBatchButton()
  cy.contains(transactionAddedToBatchStr).click().should('not.be.visible')
}

function fillTransactionData(EOA, amount) {
  cy.get(recipientInput).type(EOA, { delay: 1 })
  // Click on the Token selector
  cy.get(tokenSelector).click()
  cy.get(listBox).contains(constants.tokenNames.sepoliaEther).click()
  cy.get(amountInput).type(amount)
  cy.contains(main.nextBtnStr).click()
}

function setNonceAndProceed(currentNonce) {
  cy.get(nonceInput).clear().type(currentNonce, { force: true }).blur()
  cy.contains(main.executeBtnStr).scrollIntoView()
}

function executeTransaction() {
  cy.waitForSelector(() => {
    return cy.get(executeOptionsContainer).then(() => {
      cy.contains(yesExecuteString, { timeout: 4000 }).click()
      cy.contains(addToBatchBtn).should('not.exist')
    })
  })
}

function addToBatchButton() {
  cy.get('button').contains(addToBatchBtn).click()
}

export function openBatchtransactionsModal() {
  cy.get(batchTxTopBar).should('be.visible').click()
  cy.contains(batchedTransactionsStr).should('be.visible')
}

export function openNewTransactionModal() {
  cy.get(addNewTxBatch).click()
  cy.contains(sendTokensButn).click()
}

export function addNewTransactionToBatch(EOA, currentNonce, funds_first_tx) {
  openBatchtransactionsModal()
  openNewTransactionModal()
  addToBatch(EOA, currentNonce, funds_first_tx)
}

export function verifyAmountTransactionsInBatch(count) {
  cy.contains(batchedTransactionsStr, { timeout: 7000 })
    .should('be.visible')
    .parents('aside')
    .find('ul > li')
    .should('have.length', count)
}

export function clickOnConfirmBatchBtn() {
  cy.get('button').contains(confirmBatchBtn).should('be.visible').should('be.enabled').click()
}

export function verifyBatchTransactionsCount(count) {
  cy.contains(`This batch contains ${count} transactions`).should('be.visible')
}

export function clickOnBatchCounter() {
  cy.get(batchTxCounter).click()
}

export function verifyBatchIconCount(count) {
  cy.get(batchTxCounter).contains(count)
}

export function verifyNewTxButtonStatus(param) {
  cy.get('button').contains(newTransactionBtnStr).should(param)
}

export function isTxExpanded(index, option) {
  let item = option ? expandedItem : collapsedItem
  cy.contains(batchedTxs)
    .parent()
    .within(() => {
      cy.get('li').eq(index).find(item)
    })
}
export function verifyCountOfActions(count) {
  main.verifyElementsCount(accordionActionItem, count)
}
