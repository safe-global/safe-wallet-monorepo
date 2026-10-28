import { LS_NAMESPACE } from '../../../src/config/constants'

const tokenAmountFld = '[data-testid="token-amount-field"]'
const spendingLimitTxOption = '[data-testid="spending-limit-tx"]'
const standardTx = '[data-testid="standard-tx"]'

export function selectSpendingLimitOption() {
  cy.get(spendingLimitTxOption).click()
  cy.get(spendingLimitTxOption).find('input').should('be.checked')
}

export function selectStandardOption() {
  cy.get(standardTx).click()
  cy.get(standardTx).find('input').should('be.checked')
}

export function enterSpendingLimitAmount(amount) {
  cy.get(tokenAmountFld).clear().type(amount)
}

/**
 * Local storage that turns SAFE_PRO off through the feature flag override (dev builds only), so
 * the Safe Pro gate does not replace the spending limit actions with its upsell.
 */
export const safeProOffStorage = { [`${LS_NAMESPACE}featureFlagOverrides`]: { SAFE_PRO: false } }
