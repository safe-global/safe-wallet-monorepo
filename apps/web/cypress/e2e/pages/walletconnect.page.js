import * as main from './main.page.js'

export const wcInput = '[data-testid="wc-input"]'
export const wcLogo = '[data-testid="wc-icon"]'
export const wcTitle = '[data-testid="wc-title"]'
const wcButton = 'span[data-track="walletconnect: WC popup"]'

export function checkLogoAndTitleAreVisible() {
  main.verifyElementsIsVisible([wcLogo, wcTitle])
}

export function clickOnWCBtn() {
  cy.get(wcButton).click()
}

