import * as modal from '../modals.page'

export function verifyConfirmationWindowTitle(title) {
  cy.get(modal.modalTitle).should('contain', title)
}

export function verifyMessagePresent(msg) {
  cy.get('textarea').should('contain', msg)
}

export function verifySafeAppInPopupWindow(safeApp) {
  cy.contains(safeApp)
}
