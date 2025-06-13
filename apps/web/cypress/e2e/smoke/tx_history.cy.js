import * as constants from '../../support/constants'
import * as createTx from '../pages/create_tx.pages'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeOnchainRejection = data.type.onchainRejection
const typeBatch = data.type.batchNativeTransfer
const typeReceive = data.type.receive
const typeSend = data.type.send
const typeDeleteAllowance = data.type.deleteSpendingLimit
const typeGeneral = data.type.general
const typeUntrustedToken = data.type.untrustedReceivedToken

// TODO: Replace this test with jest (EN-141)
describe('[SMOKE] Tx history tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_23)
    cy.fixture('history/history_tx_1.json').then((mockData) => {
      cy.intercept('GET', constants.transactionHistoryEndpoint, mockData).as('getHistory')
    })
    cy.wait('@getHistory')
  })

  // mock
  // Token receipt
  it('[SMOKE] Verify summary for token receipt', () => {
    createTx.verifySummaryByName(
      typeReceive.summaryTitle,
      typeReceive.summaryTxInfo,
      [typeReceive.summaryTxInfo, typeGeneral.statusOk],
      typeReceive.altImage,
    )
  })

  // mock
  it('[SMOKE] Verify exapanded details for token receipt', () => {
    createTx.clickOnTransactionItemByName(typeReceive.summaryTitle, typeReceive.summaryTxInfo)
    createTx.verifyExpandedDetails([
      typeReceive.title,
      typeReceive.receivedFrom,
      typeReceive.senderAddress,
      typeReceive.transactionHash,
    ])
  })

  // mock
  it('[SMOKE] Verify summary for token send', () => {
    createTx.verifySummaryByName(
      typeSend.title,
      null,
      [typeSend.summaryTxInfo2, typeGeneral.statusOk],
      typeSend.altImage,
      typeSend.altToken,
    )
  })

  // mock
  it('[SMOKE] Verify summary for on-chain rejection', () => {
    createTx.verifySummaryByName(
      typeOnchainRejection.title,
      null,
      [typeGeneral.statusOk],
      typeOnchainRejection.altImage,
    )
  })

  // mock
  it('[SMOKE] Verify summary for batch', () => {
    createTx.verifySummaryByName(typeBatch.title, typeBatch.summaryTxInfo, [
      typeBatch.summaryTxInfo,
      typeGeneral.statusOk,
    ])
  })

  // mock
  it('[SMOKE] Verify summary for allowance deletion', () => {
    createTx.verifySummaryByName(
      typeDeleteAllowance.title,
      typeDeleteAllowance.summaryTxInfo,
      [typeDeleteAllowance.summaryTxInfo, typeGeneral.statusOk],
      typeDeleteAllowance.altImage,
    )
  })

  // mock
  it('[SMOKE] Verify summary for untrusted token', () => {
    createTx.toggleUntrustedTxs()
    createTx.verifySummaryByName(
      typeUntrustedToken.summaryTitle,
      typeUntrustedToken.summaryTxInfo,
      [typeUntrustedToken.summaryTxInfo, typeGeneral.statusOk],
      typeUntrustedToken.altImage,
    )
    createTx.verifySpamIconIsDisplayed(typeUntrustedToken.title, typeUntrustedToken.summaryTxInfo)
  })
})
