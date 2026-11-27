export const jsonInput = 'input[accept="application/json,.json"]'

export function verifyValidImportInputExists() {
  cy.get(jsonInput).should('exist')
}
