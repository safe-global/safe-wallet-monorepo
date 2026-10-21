import { messageItem } from './create_tx.pages'

export const offchainMessage = 'Test message 2 off-chain'

export function clickOnMessageSignBtn(index) {
  cy.get(messageItem)
    .eq(index)
    .within(() => {
      cy.get('button').contains('Sign').click()
    })
}
