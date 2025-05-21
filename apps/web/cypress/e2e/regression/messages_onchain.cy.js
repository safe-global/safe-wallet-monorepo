import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as msg_data from '../../fixtures/txmessages_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeMessagesOnchain = msg_data.type.onChain

describe('Onchain Messages tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_10)
  })

  it('Verify expanded details for signed on-chain message', () => {
    createTx.clickOnTransactionItemByName(typeMessagesOnchain.contractName)
    createTx.verifyExpandedDetails([typeMessagesOnchain.contractName, typeMessagesOnchain.delegateCall])
  })

  it('Verify expanded details for unsigned on-chain message', () => {
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_10)
    createTx.clickOnTransactionItemByName(typeMessagesOnchain.contractName)
    createTx.verifyExpandedDetails([typeMessagesOnchain.contractName, typeMessagesOnchain.delegateCall])
  })

  it('Verify summary for unsigned on-chain message', () => {
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_10)
    createTx.verifySummaryByName(
      typeMessagesOnchain.contractName,
      null,
      [typeMessagesOnchain.oneOftwo, typeMessagesOnchain.signMessage],
      typeMessagesOnchain.altImage,
    )
  })

  // Added to prod
  it('Verify summary for signed on-chain message', () => {
    createTx.verifySummaryByName(
      typeMessagesOnchain.contractName,
      null,
      [(typeMessagesOnchain.success, typeMessagesOnchain.signMessage)],
      typeMessagesOnchain.altImage,
    )
  })
})
