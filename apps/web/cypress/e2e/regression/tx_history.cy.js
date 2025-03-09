import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createTx from '../pages/create_tx.pages'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeCreateAccount = data.type.accountCreation
const typeReceive = data.type.receive
const typeSend = data.type.send
const typeSpendingLimits = data.type.spendingLimits
const typeDeleteAllowance = data.type.deleteSpendingLimit
const typeSideActions = data.type.sideActions
const typeGeneral = data.type.general

describe('Tx history tests 1', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept(
      'GET',
      `**${constants.stagingCGWChains}${constants.networkKeys.sepolia}/${constants.stagingCGWSafes
      }${staticSafes.SEP_STATIC_SAFE_7.substring(4)}/transactions/history**`,
      (req) => {
        req.url = `https://safe-client.staging.5afe.dev/v1/chains/11155111/safes/0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb/transactions/history?timezone=Europe/Berlin&trusted=false&cursor=limit=100&offset=1`
        req.continue()
      },
    ).as('allTransactions')

    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
    cy.wait('@allTransactions')
  })

  // Added to prod
  // Account creation
  it('Verify summary for account creation', () => {
    createTx.verifySummaryByName(
      typeCreateAccount.title,
      null,
      [typeCreateAccount.actionsSummary, typeGeneral.statusOk],
      typeCreateAccount.altTmage,
      null,
    )
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
      typeCreateAccount.transactionHash,
    ])
  })

  it('Verify external links exist for account creation', () => {
    createTx.clickOnTransactionItemByName(typeCreateAccount.title)
    createTx.verifyNumberOfExternalLinks(4)
  })

  // Added to prod
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

  // Added to prod
  // Spending limits
  it('Verify summary for setting spend limits', () => {
    // name, token, data, alt, altToken
    createTx.verifySummaryByName(
      typeSpendingLimits.title,
      typeSpendingLimits.summaryTxInfo,
      [typeGeneral.statusOk],
      typeSpendingLimits.altImage,
    )
  })

  // Added to prod
  it('Verify exapanded details for initial spending limits setup', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.verifyExpandedDetails(
      [
        typeSpendingLimits.contractTitle,
        typeSpendingLimits.call_multiSend,
        typeSpendingLimits.transactionHash,
      ],
      createTx.delegateCallWarning,
    )
  })

  // Added to prod
  it('Verify that 3 actions exist in initial spending limits setup', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.verifyActions([
      typeSpendingLimits.enableModule.title,
      typeSpendingLimits.addDelegate.title,
      typeSpendingLimits.setAllowance.title,
    ])
  })

  it('Verify that all 3 actions can be expanded and collapsed in initial spending limits setup', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.expandAllActions([
      typeSpendingLimits.enableModule.title,
      typeSpendingLimits.addDelegate.title,
      typeSpendingLimits.setAllowance.title,
    ])
    createTx.collapseAllActions([
      typeSpendingLimits.enableModule.moduleAddressTitle,
      typeSpendingLimits.addDelegate.delegateAddressTitle,
      typeSpendingLimits.setAllowance.delegateAddressTitle,
    ])
  })

  it('Verify that addDelegate action can be expanded and collapsed in spending limits', () => {
    createTx.clickOnTransactionItemByName(typeSpendingLimits.title, typeSpendingLimits.summaryTxInfo)
    createTx.clickOnExpandableAction(typeSpendingLimits.addDelegate.title)
    createTx.verifyActions([typeSpendingLimits.addDelegate.delegateAddressTitle])
    createTx.collapseAllActions([typeSpendingLimits.addDelegate.delegateAddressTitle])
  })

  // Spending limit deletion
  it('Verify exapanded details for allowance deletion', () => {
    createTx.clickOnTransactionItemByName(typeDeleteAllowance.title, typeDeleteAllowance.summaryTxInfo)
    createTx.verifyExpandedDetails([
      typeDeleteAllowance.description,
      typeDeleteAllowance.beneficiary,
      typeDeleteAllowance.beneficiaryAddress,
      typeDeleteAllowance.transactionHash,
      typeDeleteAllowance.token,
      typeDeleteAllowance.tokenName,
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

  it.skip('Verify address can be copied in advanced details', () => {
    const data =
      '0x885133e3000000000000000000000000c16db0251654c0a72e91b190d81ead367d2c6fed0000000000000000000000000000000000000000000000000000000000000000'
    createTx.clickOnTransactionItemByName(typeDeleteAllowance.title, typeDeleteAllowance.summaryTxInfo)
    createTx.expandAdvancedDetails([typeDeleteAllowance.baseGas])
    createTx.clickOnCopyDataBtn(data)
  })
})
