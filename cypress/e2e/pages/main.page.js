const acceptSelection = 'Accept selection'
const gotItBtn = 'Got it'

export function acceptCookies() {
  cy.contains(acceptSelection).click()
  cy.contains(acceptSelection).should('not.exist')
}
