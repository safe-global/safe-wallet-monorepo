import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as modal from '../pages/modals.page'
import * as messages from '../pages/messages.pages.js'
import * as msg_confirmation_modal from '../pages/modals/message_confirmation.pages.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Offchain Messages tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify confirmation window is displayed for unsigned message', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_26)
    wallet.connectSigner(signer2)
    messages.clickOnMessageSignBtn(0)
    msg_confirmation_modal.verifyConfirmationWindowTitle(modal.modalTitiles.confirmMsg)
    msg_confirmation_modal.verifyMessagePresent(messages.offchainMessage)
    msg_confirmation_modal.clickOnMessageDetails()
    msg_confirmation_modal.verifyOffchainMessageHash(0)
    msg_confirmation_modal.verifyOffchainMessageHash(1)
    msg_confirmation_modal.checkMessageInfobox()
  })
})
