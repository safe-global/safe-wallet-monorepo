export function verifyMessagePresent(msg) {
  cy.get('textarea').should('contain', msg)
}
