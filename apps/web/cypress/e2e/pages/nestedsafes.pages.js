const addNestedSafeBtn = '[data-testid="add-nested-safe-button"]'
const nestedSafeNameInput = '[data-testid="nested-safe-name-input"]'
const nextBtn = '[data-testid="next-button"]'

export function clickOnAddNextBtn() {
  cy.get(nextBtn).click()
}

export function clickOnAddNestedSafeBtn() {
  cy.get(addNestedSafeBtn).click()
}

export function typeName(name) {
  cy.get(`${nestedSafeNameInput} input`).clear().type(name).should('have.value', name)
}
