import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as messages from '../pages/messages.pages.js'
import * as msg_confirmation_modal from '../pages/modals/message_confirmation.pages.js'
import * as navigation from '../pages/navigation.page'
import * as spendinglimit from '../pages/spending_limits.pages'

let staticSafes = []

const sendValue = 0.00002
const safe = 'sep:0xF184a243925Bf7fb1D64487339FF4F177Fb75644'

const txs = {
  oneOfoneTx:
    '&id=multisig_0xF184a243925Bf7fb1D64487339FF4F177Fb75644_0xccc6945d0d674ceb45f856841bfc3991b4da27ea578ffe9652bbc6835944b323',
}

const noteCreator = 'sep:0x96D4...5aC5'

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
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.checkMaxNoteLength()
  })

  it('Verify the tx note information message', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.checkNoteWarningMsg()
  })

  it('Verify in the transaction details the note is visible', () => {
    cy.visit(constants.transactionUrl + safe + txs.oneOfoneTx)
    createtx.checkNoteRecordedNote(createtx.recordedTxNote)
  })

  it('Verify hovering over the note tooltip shows note originator', () => {
    cy.visit(constants.transactionUrl + safe + txs.oneOfoneTx)
    createtx.checkNoteCreator(noteCreator)
  })

  it('Verify that after a tx was executed, the tx note is not editable', () => {
    cy.visit(constants.transactionUrl + safe + txs.oneOfoneTx)
    createtx.checkNoteRecordedNoteReadOnly()
  })

  it('Verify no tx note field is present when signing a message', () => {
    cy.visit(constants.transactionsMessagesUrl + staticSafes.SEP_STATIC_SAFE_26)
    wallet.connectSigner(signer2)
    messages.clickOnMessageSignBtn(0)
    msg_confirmation_modal.verifyMessagePresent(messages.offchainMessage)
    main.verifyElementsCount(createtx.noteTextField, 0)
  })

  it('Verify no tx note field is present during the use of a spending limit', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectSpendingLimitOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 0)
  })

  it('Verify that in a send funds tx the note field shows up in the execution part of the form', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectStandardOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 1)
  })

  it('Verify no tx note is present during a recovery tx', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer)
    navigation.clickOnNewTxBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    spendinglimit.enterSpendingLimitAmount(0.00001)
    spendinglimit.selectStandardOption()
    createtx.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 1)
  })
})
