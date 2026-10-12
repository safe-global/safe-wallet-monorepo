export const exchangeStr = 'Bridge'

const bridgleLink = 'a[href*="/bridge"]'

export function clickOnBridgeOption() {
  cy.get(bridgleLink).scrollIntoView().should('be.visible').click()
  cy.wait(1000)
}
