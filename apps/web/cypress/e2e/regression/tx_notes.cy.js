import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as messages from '../pages/messages.pages.js'
import * as msg_confirmation_modal from '../pages/modals/message_confirmation.pages.js'
import * as navigation from '../pages/navigation.page'
import * as spendinglimit from '../pages/spending_limits.pages'
import notes from '../../fixtures/notes.js'

let staticSafes = []

const sendValue = 0.00002
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY
const signerAddress = walletCredentials.OWNER_4_WALLET_ADDRESS

function happyPathToStepTwo() {
  createtx.typeRecipientAddress(constants.EOA)
  createtx.clickOnTokenselectorAndSelectSepoliaEth()
  createtx.setSendValue(sendValue)
  createtx.clickOnNextBtn()
}

describe('Transaction notes tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the tx notes field only allows 60 characters', () => {
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.checkMaxNoteLength()
  })

  it('Verify the tx note information message', () => {
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.checkNoteWarningMsg()
  })

  it('Verify in the transaction details the note is visible', () => {
    cy.visit(constants.transactionUrl + notes.safe + notes.oneOfoneTx)
    createtx.checkNoteRecordedNote(createtx.recordedTxNote)
  })

  it('Verify hovering over the note tooltip shows note originator', () => {
    cy.visit(constants.transactionUrl + notes.safe + notes.oneOfoneTx)
    createtx.checkNoteCreator(notes.creator)
  })

  it('Verify that after a tx was executed, the tx note is not editable', () => {
    cy.visit(constants.transactionUrl + notes.safe + notes.oneOfoneTx)
    createtx.checkNoteRecordedNoteReadOnly()
  })

  it('Verify no tx note field is present when signing a message', () => {
    wallet.connectSignerViaStorage(signer2, constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_26)
    messages.clickOnMessageSignBtn(0)
    msg_confirmation_modal.verifyMessagePresent(messages.offchainMessage)
    main.verifyElementsCount(createtx.noteTextField, 0)
  })

  it('Verify no tx note field is present during the use of a spending limit', () => {
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectSpendingLimitOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 0)
  })

  it('Verify that in a send funds tx the note field shows up in the execution part of the form', () => {
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectStandardOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 1)
  })

  it('Verify no tx note is present during a recovery tx', () => {
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectStandardOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 1)
  })
})
