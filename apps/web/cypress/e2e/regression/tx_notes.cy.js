import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page'
import * as spendinglimit from '../pages/spending_limits.pages'
import notes from '../../fixtures/notes.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []

let signer, signerAddress
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
  signerAddress = walletCredentials.OWNER_4_WALLET_ADDRESS
})

describe('Transaction notes tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify in the transaction details the note is visible', () => {
    cy.visit(constants.transactionUrl + notes.safe + notes.oneOfoneTx)
    createtx.checkNoteRecordedNote(createtx.recordedTxNote)
  })

  it('Verify hovering over the note tooltip shows note originator', () => {
    cy.visit(constants.transactionUrl + notes.safe + notes.oneOfoneTx)
    createtx.checkNoteCreator(notes.creator)
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
})
