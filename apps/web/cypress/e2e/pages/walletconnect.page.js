export const wcInput = '[data-testid="wc-input"]'
const wcButton = 'span[data-track="walletconnect: WC popup"]'

export const connectWCStr = 'Please open one of your Safe accounts to connect to via WalletConnect'

export function clickOnWCBtn() {
  cy.get(wcButton).click()
}
