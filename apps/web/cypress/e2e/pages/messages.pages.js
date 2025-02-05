import { messageItem } from './create_tx.pages'
const onchainMsgInput = 'input[placeholder*="Message"]'

export const offchainMessage = 'Test message 2 off-chain'

export function enterOnchainMessage(msg) {
  cy.get(onchainMsgInput).type(msg)
}

export function clickOnMessageSignBtn(index) {
  cy.get(messageItem)
    .eq(index)
    .within(() => {
      cy.get('button').contains('Sign').click()
    })
}
