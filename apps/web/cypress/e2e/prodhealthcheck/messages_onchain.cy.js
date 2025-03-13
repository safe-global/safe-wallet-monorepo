import * as constants from '../../support/constants.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as msg_data from '../../fixtures/txmessages_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'

let staticSafes = []

const typeMessagesOnchain = msg_data.type.onChain

describe('[PROD] Onchain Messages tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_10)
    cy.contains(createTx.txStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
  })

  it('Verify summary for signed on-chain message', () => {
    createTx.verifySummaryByName(
      typeMessagesOnchain.contractName,
      null,
      [typeMessagesOnchain.success, typeMessagesOnchain.signMessage],
      typeMessagesOnchain.altImage,
    )
  })
})
