import * as main from './main.page'

export const addToBatchBtn = 'Add to batch'
const confirmBatchBtn = 'Confirm batch'

export const closeModalBtnBtn = '[data-testid="CloseIcon"]'
export const batchTxCounter = '[data-track="batching: Batch sidebar open"] button'
export const addNewStransactionStr = 'Add new transaction'
export const allActionsSection = '[data-testid="all-actions"]'
export const accordionActionItem = '[data-testid="action-item"]'

const executeOptionsContainer = 'div[role="radiogroup"]'

function executeTransaction() {
  cy.waitForSelector(() => {
    return cy.get(executeOptionsContainer).then(() => {
      cy.contains(yesExecuteString, { timeout: 4000 }).click()
      cy.contains(addToBatchBtn).should('not.exist')
    })
  })
}

export function clickOnConfirmBatchBtn() {
  cy.get('button').contains(confirmBatchBtn).should('be.visible').should('be.enabled').click()
}

export function clickOnBatchCounter() {
  cy.get(batchTxCounter).click()
}

export function verifyCountOfActions(count) {
  main.verifyElementsCount(accordionActionItem, count)
}
