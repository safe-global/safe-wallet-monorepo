import * as constants from '../../support/constants'
import * as createTx from '../pages/create_tx.pages'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeCreateAccount = data.type.accountCreation
const typeDeleteAllowance = data.type.deleteSpendingLimit

describe('Tx history tests 1', () => {
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
    cy.wait('@allTransactions')
  })

  // Added to prod
  it('Verify exapanded details for account creation', () => {
    createTx.clickOnTransactionItemByName(typeCreateAccount.title)
    createTx.verifyExpandedDetails([
      typeCreateAccount.creator.actionTitle,
      typeCreateAccount.creator.address,
      typeCreateAccount.factory.actionTitle,
      typeCreateAccount.factory.name,
      typeCreateAccount.factory.address,
      typeCreateAccount.masterCopy.actionTitle,
      typeCreateAccount.masterCopy.name,
      typeCreateAccount.masterCopy.address,
    ])
  })

  // Added to prod
  it('Verify advanced details displayed in exapanded details for allowance deletion', () => {
    createTx.clickOnTransactionItemByName(typeDeleteAllowance.title, typeDeleteAllowance.summaryTxInfo)
    createTx.expandAdvancedDetails([
      typeDeleteAllowance.baseGas,
      typeDeleteAllowance.operation,
      typeDeleteAllowance.zero_call,
    ])
    createTx.collapseAdvancedDetails([typeDeleteAllowance.baseGas])
  })
})
