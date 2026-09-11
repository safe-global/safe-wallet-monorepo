import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'
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

describe('Tx history tests 6', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
  })

  // Token receipt
  it('Verify summary for token receipt', () => {
    createTx.verifySummaryByName(typeReceive.summaryTitle, [typeReceive.summaryTxInfo, typeGeneral.statusOk], {
      token: typeReceive.summaryTxInfo,
    })
  })

  it('Verify exapanded details for token receipt', () => {
    createTx.clickOnTransactionItemByName(typeReceive.summaryTitle, typeReceive.summaryTxInfo)
    createTx.verifyExpandedDetails([typeReceive.title, typeReceive.receivedFrom, typeReceive.senderAddress])
  })

  it('Verify summary for token send', () => {
    createTx.verifySummaryByName(typeSend.title, [typeSend.summaryTxInfo2, typeGeneral.statusOk], {
      altToken: typeSend.altToken,
    })
  })

  it('Verify summary for on-chain rejection', () => {
    createTx.verifySummaryByName(typeOnchainRejection.title, [typeGeneral.statusOk])
  })

  it('Verify summary for batch', () => {
    createTx.verifySummaryByName(typeBatch.title, [typeBatch.summaryTxInfo, typeGeneral.statusOk], {
      token: typeBatch.summaryTxInfo,
    })
  })

  it('Verify summary for allowance deletion', () => {
    createTx.verifySummaryByName(typeDeleteAllowance.title, [typeDeleteAllowance.summaryTxInfo, typeGeneral.statusOk], {
      token: typeDeleteAllowance.summaryTxInfo,
    })
  })

  it('Verify summary for untrusted token', () => {
    createTx.toggleUntrustedTxs()
    createTx.verifySummaryByName(
      typeUntrustedToken.summaryTitle,
      [typeUntrustedToken.summaryTxInfo, typeGeneral.statusOk],
      { token: typeUntrustedToken.summaryTxInfo },
    )
    createTx.verifySpamIconIsDisplayed(typeUntrustedToken.title, typeUntrustedToken.summaryTxInfo)
  })
})
