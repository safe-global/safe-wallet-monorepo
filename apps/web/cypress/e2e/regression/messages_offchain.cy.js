import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as modal from '../pages/modals.page'
import * as messages from '../pages/messages.pages.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as msg_confirmation_modal from '../pages/modals/message_confirmation.pages.js'
import * as msg_data from '../../fixtures/txmessages_data.json'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const typeMessagesGeneral = msg_data.type.general
const typeMessagesOffchain = msg_data.type.offChain

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

  it('Verify summary for off-chain unsigned messages', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_10)
    createTx.verifySummaryByIndex(0, [
      typeMessagesGeneral.sign,
      typeMessagesGeneral.oneOftwo,
      typeMessagesOffchain.testMessage1,
    ])
    createTx.verifySummaryByIndex(2, [
      typeMessagesGeneral.sign,
      typeMessagesGeneral.oneOftwo,
      typeMessagesOffchain.testMessage2,
    ])
  })

  it('Verify summary for off-chain signed messages', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_10)
    createTx.verifySummaryByIndex(1, [
      typeMessagesGeneral.sign,
      typeMessagesGeneral.oneOftwo,
      typeMessagesOffchain.name,
    ])
    createTx.verifySummaryByIndex(3, [
      typeMessagesGeneral.sign,
      typeMessagesGeneral.oneOftwo,
      typeMessagesOffchain.testMessage3,
    ])
  })

  it('Verify exapanded details for EIP 191 off-chain message', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_10)
    createTx.clickOnTransactionItemByIndex(2)
    cy.contains(typeMessagesOffchain.message2).should('be.visible')
  })

  it('Verify exapanded details for EIP 712 off-chain message', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_10)
    const jsonString = createTx.messageNestedStr
    const values = [
      typeMessagesOffchain.name,
      typeMessagesOffchain.testStringNested,
      typeMessagesOffchain.EIP712Domain,
      typeMessagesOffchain.message3,
    ]

    createTx.clickOnTransactionItemByIndex(1)
    cy.get(createTx.txRowTitle)
      .next()
      .then(($section) => {
        expect($section.text()).to.include(jsonString)
        const count = $section.text().split(jsonString).length - 1
        expect(count).to.eq(3)
      })

    main.verifyTextVisibility(values)
  })
})
