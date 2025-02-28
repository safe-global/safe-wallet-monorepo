import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createTx from '../pages/create_tx.pages'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'

let staticSafes = []

const typeCreateAccount = data.type.accountCreation
const typeReceive = data.type.receive
const typeSend = data.type.send
const typeSpendingLimits = data.type.spendingLimits
const typeDeleteAllowance = data.type.deleteSpendingLimit
const typeSideActions = data.type.sideActions
const typeGeneral = data.type.general

describe('[PROD] Tx history tests 1', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept(
      'GET',
      `**${constants.stagingCGWChains}${constants.networkKeys.sepolia}/${constants.stagingCGWSafes
      }${staticSafes.SEP_STATIC_SAFE_7.substring(4)}/transactions/history**`,
      (req) => {
        req.url = `https://safe-client.safe.global/v1/chains/11155111/safes/0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb/transactions/history?timezone=Europe/Berlin&trusted=false&cursor=limit=100&offset=1`
        req.continue()
      },
    ).as('allTransactions')

    cy.visit(constants.prodbaseUrl + constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
    cy.wait('@allTransactions')
    cy.contains(createTx.txStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
  })

  // Account creation
  it('Verify summary for account creation', () => {
    createTx.verifySummaryByName(
      typeCreateAccount.title,
      null,
      [typeCreateAccount.actionsSummary, typeGeneral.statusOk],
      typeCreateAccount.altImage,
    )
  })

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
      typeCreateAccount.transactionHash,
    ])
  })

  // Token send
  it('Verify exapanded details for token send', () => {
    createTx.clickOnTransactionItemByName(typeSend.title, typeSend.summaryTxInfo)
    createTx.verifyExpandedDetails([typeSend.sentTo, typeSend.recipientAddress, typeSend.transactionHash])
    createTx.verifyActionListExists([
      typeSideActions.created,
      typeSideActions.confirmations,
      typeSideActions.executedBy,
    ])
  })

  // Spending limits
  it('Verify summary for setting spend limits', () => {
    createTx.verifySummaryByName(
      typeSpendingLimits.title,
      typeSpendingLimits.summaryTxInfo,
      [typeGeneral.statusOk],
      typeSpendingLimits.altImage,
    )
  })

  it('Verify exapanded details for initial spending limits setup', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.verifyExpandedDetails(
      [
        typeSpendingLimits.contractTitle,
        typeSpendingLimits.call_multiSend,
        typeSpendingLimits.transactionHash,
        typeSpendingLimits.safeTxHash,
      ],
      createTx.delegateCallWarning,
    )
  })

  it('Verify that 3 actions exist in initial spending limits setup', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.verifyActions([
      typeSpendingLimits.enableModule.title,
      typeSpendingLimits.addDelegate.title,
      typeSpendingLimits.setAllowance.title,
    ])
  })

  // Spending limit deletion
  it('Verify exapanded details for allowance deletion', () => {
    createTx.clickOnTransactionItemByName(typeDeleteAllowance.title, typeDeleteAllowance.summaryTxInfo)
    createTx.verifyExpandedDetails([
      typeDeleteAllowance.description,
      typeDeleteAllowance.beneficiary,
      typeDeleteAllowance.beneficiaryAddress,
      typeDeleteAllowance.transactionHash,
      typeDeleteAllowance.safeTxHash,
      typeDeleteAllowance.token,
      typeDeleteAllowance.tokenName,
    ])
  })

  // Unskip when advanced details PR is merged to main
  it.skip('Verify advanced details displayed in exapanded details for allowance deletion', () => {
    createTx.clickOnTransactionItemByName(typeDeleteAllowance.title, typeDeleteAllowance.summaryTxInfo)
    createTx.expandAdvancedDetails([typeDeleteAllowance.baseGas])
    createTx.collapseAdvancedDetails([typeDeleteAllowance.baseGas])
  })
})
