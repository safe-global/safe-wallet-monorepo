export const modalTitle = '[data-testid="modal-title"]'
export const modal = '[data-testid="modal-view"]'
export const modalHeader = '[data-testid="modal-header"]'
export const cardContent = '[data-testid="card-content"]'

export const modalTitiles = {
  editEntry: 'Edit entry',
  deleteEntry: 'Delete entry',
  dataImport: 'Data import',
  confirmTx: 'Confirm transaction',
  confirmMsg: 'Confirm message',
}

export function verifyModalTitle(title) {
  cy.get(modalTitle).should('contain', title)
}
