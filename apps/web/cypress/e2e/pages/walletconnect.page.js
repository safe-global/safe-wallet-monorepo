import * as main from './main.page.js'

export const wcInput = '[data-testid="wc-input"]'
export const wcLogo = '[data-testid="wc-icon"]'
export const wcTitle = '[data-testid="wc-title"]'
const wcButton = 'span[data-track="walletconnect: WC popup"]'
const wcHintsBtn = '[data-track="walletconnect: WC hide hints"] > button'

export function checkBasicElementsVisible() {
  main.verifyElementsIsVisible([wcLogo, wcTitle, wcHintsBtn])
}

export function clickOnWCBtn() {
  cy.get(wcButton).click()
}
