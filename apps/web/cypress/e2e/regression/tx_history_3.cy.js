import * as constants from '../../support/constants.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeReceive = data.type.receive
const typeGeneral = data.type.general

describe('Incoming tx history tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept(
      'GET',
      `**${constants.stagingCGWChains}${constants.networkKeys.sepolia}/${
        constants.stagingCGWSafes
      }${staticSafes.SEP_STATIC_SAFE_7.substring(4)}/transactions/history**`,
      { fixture: 'txhistory_incoming_data.json' },
    ).as('txHistory')

    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
    cy.wait('@txHistory')
  })

  it('Verify Incoming ERC20 with logo in the history', () => {
    createTx.verifySummaryByName(typeReceive.summaryTxInfoDAI, [typeReceive.summaryTitle, typeGeneral.statusOk], {
      altToken: typeReceive.altImageDAI,
    })
  })

  it('Verify Incoming ERC20 without logo in the history', () => {
    createTx.verifySummaryByName(typeReceive.summaryTxInfoETH35, [typeReceive.summaryTitle, typeGeneral.statusOk], {
      altToken: typeReceive.altTokenETH35,
    })
  })

  it('Verify Incoming native token in the history', () => {
    createTx.verifySummaryByName(typeReceive.summaryTxInfoETH, [typeReceive.summaryTitle, typeGeneral.statusOk], {
      altToken: typeReceive.altToken,
    })
  })

  it('Verify Incoming NFT in the history', () => {
    createTx.verifySummaryByName(typeReceive.summaryTxInfoNFT, [typeReceive.summaryTitle, typeGeneral.statusOk], {
      altToken: typeReceive.altTokenNFT,
    })
  })
})
