export const exchangeStr = 'Exchange'

const bridgleLink = 'a[href*="/bridge"]'

export function clickOnBridgeOption() {
    cy.get(bridgleLink).should('be.visible').click();
    cy.wait(1000)
}