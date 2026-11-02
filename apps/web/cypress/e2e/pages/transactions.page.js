import * as main from './main.page'
import * as constants from '../../support/constants.js'

const executeBtn = '[data-testid="combo-submit-execute"]'
const signBtn = '[data-testid="sign-btn"]'
const untrustedFallbackHandlerWarning = '[data-testid="untrusted-fallback-handler-warning"]'

export function verifyUntrustedHandllerWarningDoesNotExist() {
  cy.get(untrustedFallbackHandlerWarning).should('not.exist')
}

export function verifySignBtnEnabled() {
  cy.get(signBtn).should('be.enabled')
}

export function clickOnExecuteBtn() {
  cy.get(executeBtn, { timeout: 60000 }).should('be.enabled').click()
}

export function verifyExecuteBtnIsVisible() {
  cy.get(executeBtn).scrollIntoView().should('be.visible')
}
