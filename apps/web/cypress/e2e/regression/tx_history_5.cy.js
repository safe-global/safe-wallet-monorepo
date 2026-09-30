import * as constants from '../../support/constants.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeUntrustedToken = data.type.untrustedReceivedToken

describe('Safe app tx history tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that copying sender address of untrusted token shows warning popup', () => {
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
    createTx.toggleUntrustedTxs()
    createTx.clickOnTransactionItemByName(typeUntrustedToken.summaryTitle, typeUntrustedToken.summaryTxInfo)
    createTx.clickOnCopyBtn(0)
    createTx.verifyWarningModalVisible()
  })
})
