import * as main from './main.page'

export const addToBatchBtn = 'Add to batch'

export const closeModalBtnBtn = '[data-testid="CloseIcon"]'
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

export function verifyCountOfActions(count) {
  main.verifyElementsCount(accordionActionItem, count)
}
