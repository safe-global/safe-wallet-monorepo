import { fixtureGetters } from '../../support/fixture.js'
import * as main from './main.page'
import * as constants from '../../support/constants.js'

const executeBtn = '[data-testid="combo-submit-execute"]'
const signBtn = '[data-testid="sign-btn"]'
const untrustedFallbackHandlerWarning = '[data-testid="untrusted-fallback-handler-warning"]'

export const fallbackhandlerTx = fixtureGetters('fallbackHandlers', {
  illegalContract:
    '&id=multisig_0xc36A530ccD728d36a654ccedEB7994473474C018_0xceccff6539d75da107014e1a4ae9ccb864a6a4bf10b4e0dd38431ac80148f2f5',
})

export function verifyUntrustedHandllerWarningVisible() {
  cy.get(untrustedFallbackHandlerWarning).should('be.visible')
}

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
