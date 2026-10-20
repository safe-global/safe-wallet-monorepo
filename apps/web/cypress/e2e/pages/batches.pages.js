import * as main from './main.page'

export const newTransactionBtn = '[data-testid="new-tx-btn"]'
export const addToBatchBtn = 'Add to batch'
const confirmBatchBtn = 'Confirm batch'
export const batchedTxs = 'Batched transactions'

export const closeModalBtnBtn = '[data-testid="CloseIcon"]'
export const deleteTransactionbtn = '[title="Delete transaction"]'
export const batchTxTopBar = '[data-track="batching: Batch sidebar open"] button'
export const batchTxCounter = '[data-track="batching: Batch sidebar open"] button'
export const batchedTransactionsStr = 'Batched transactions'
export const addInitialTransactionStr = 'Add an initial transaction to the batch'
export const addNewStransactionStr = 'Add new transaction'
export const allActionsSection = '[data-testid="all-actions"]'
export const accordionActionItem = '[data-testid="action-item"]'

const executeOptionsContainer = 'div[role="radiogroup"]'
const accordionTrigger = '[data-slot="accordion-trigger"]'

function executeTransaction() {
  cy.waitForSelector(() => {
    return cy.get(executeOptionsContainer).then(() => {
      cy.contains(yesExecuteString, { timeout: 4000 }).click()
      cy.contains(addToBatchBtn).should('not.exist')
    })
  })
}

export function openBatchtransactionsModal() {
  cy.get(batchTxTopBar).should('be.visible').click()
  cy.contains(batchedTransactionsStr).should('be.visible')
}

export function closeBatchtransactionsModal() {
  cy.get('aside').find('[aria-label="close"]').click()
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
  cy.get(`[data-track="batching: Batch sidebar open"] [aria-label="${count} batched transactions"]`).should('exist')
}

export function verifyNewTxButtonStatus(param) {
  cy.get(newTransactionBtn).should(param)
}

export function isTxExpanded(index, option) {
  cy.contains(batchedTxs)
    .parent()
    .within(() => {
      cy.get('li')
        .eq(index)
        .find(accordionTrigger)
        .should('have.attr', 'aria-expanded', option ? 'true' : 'false')
    })
}
export function verifyCountOfActions(count) {
  main.verifyElementsCount(accordionActionItem, count)
}
