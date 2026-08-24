const safeLoadingError = '[data-testid="safe-loading-error"]'
const mainPageButton = '[data-testid="safe-loading-error-cta"]'

export function verifySafeLoadingErrorMessage(message) {
  cy.get(safeLoadingError).should('be.visible').and('contain', message)
}

export function verifySafeLoadingErrorMessageNotVisible(message) {
  cy.get(safeLoadingError).should('not.contain', message)
}

export function verifyMainPageButtonIsVisible() {
  cy.get(mainPageButton).should('be.visible')
}
