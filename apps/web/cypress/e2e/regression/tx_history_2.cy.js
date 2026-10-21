import * as constants from '../../support/constants'
import * as createTx from '../pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Tx history tests 2', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept(
      'GET',
      `**${constants.stagingCGWChains}${constants.networkKeys.sepolia}/${
        constants.stagingCGWSafes
      }${staticSafes.SEP_STATIC_SAFE_7.substring(4)}/transactions/history**`,
      (req) => {
        req.url = `${constants.stagingCGWUrlv1}/chains/11155111/safes/${staticSafes.SEP_STATIC_SAFE_7.substring(4)}/transactions/history?timezone=Europe/Berlin&trusted=false&cursor=limit=100&offset=1`
        req.continue()
      },
    ).as('allTransactions')

    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
  })

  it('Verify number of transactions is correct', () => {
    createTx.verifyNumberOfTransactions(20)
  })
})
