import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createTx from '../pages/create_tx.pages'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const typeOnchainRejection = data.type.onchainRejection
const typeBatch = data.type.batchNativeTransfer
const typeAddOwner = data.type.addOwner
const typeChangeOwner = data.type.swapOwner
const typeRemoveOwner = data.type.removeOwner
const typeDisableOwner = data.type.disableModule
const typeChangeThreshold = data.type.changeThreshold
const typeSideActions = data.type.sideActions
const typeGeneral = data.type.general
const typeUntrustedToken = data.type.untrustedReceivedToken

describe('Tx history tests 2', () => {
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
  })

  it('Verify number of transactions is correct', () => {
    createTx.verifyNumberOfTransactions(20)
  })

  // Added to prod
  // On-chain rejection
  it('Verify exapanded details for on-chain rejection', () => {
    createTx.clickOnTransactionItemByName(typeOnchainRejection.title)
    createTx.verifyExpandedDetails([
      typeOnchainRejection.description,
      typeOnchainRejection.transactionHash,
    ])
    createTx.verifyActionListExists([
      typeSideActions.rejectionCreated,
      typeSideActions.confirmations,
      typeSideActions.executedBy,
    ])
  })

  // Added to prod
  // Batch transaction
  it('Verify exapanded details for batch', () => {
    createTx.clickOnTransactionItemByName(typeBatch.title, typeBatch.summaryTxInfo)
    createTx.verifyExpandedDetails(
      [typeBatch.contractTitle, typeBatch.transactionHash],
      createTx.delegateCallWarning,
    )
    createTx.verifyActions([typeBatch.nativeTransfer.title])
  })

  // Added to prod
  // Add owner
  it('Verify summary for adding owner', () => {
    createTx.verifySummaryByName(typeAddOwner.title, null, [typeGeneral.statusOk], typeAddOwner.altImage)
  })

  it('Verify exapanded details for adding owner', () => {
    createTx.clickOnTransactionItemByName(typeAddOwner.title)
    createTx.verifyExpandedDetails(
      [
        typeAddOwner.description,
        typeAddOwner.requiredConfirmationsTitle,
        typeAddOwner.ownerAddress,
        typeAddOwner.transactionHash,
      ],
      createTx.policyChangeWarning,
    )
  })

  // Added to prod
  // Change owner
  it('Verify summary for changing owner', () => {
    createTx.verifySummaryByName(typeChangeOwner.title, null, [typeGeneral.statusOk], typeChangeOwner.altImage)
  })

  // Added to prod
  it('Verify exapanded details for changing owner', () => {
    createTx.clickOnTransactionItemByName(typeChangeOwner.title)
    createTx.verifyExpandedDetails([
      typeChangeOwner.description,
      typeChangeOwner.newOwner.actionTitile,
      typeChangeOwner.newOwner.ownerAddress,
      typeChangeOwner.oldOwner.actionTitile,
      typeChangeOwner.oldOwner.ownerAddress,
      typeChangeOwner.transactionHash,
    ])
  })

  // Added to prod
  // Remove owner
  it('Verify summary for removing owner', () => {
    createTx.verifySummaryByName(typeRemoveOwner.title, null, [typeGeneral.statusOk], typeRemoveOwner.altImage)
  })

  it('Verify exapanded details for removing owner', () => {
    createTx.clickOnTransactionItemByName(typeRemoveOwner.title)
    createTx.verifyExpandedDetails(
      [
        typeRemoveOwner.description,
        typeRemoveOwner.requiredConfirmationsTitle,
        typeRemoveOwner.ownerAddress,
        typeRemoveOwner.transactionHash,
      ],
      createTx.policyChangeWarning,
    )
    createTx.checkRequiredThreshold(1)
  })

  // Added to prod
  // Disbale module
  it('Verify summary for disable module', () => {
    createTx.verifySummaryByName(typeDisableOwner.title, null, [typeGeneral.statusOk], typeDisableOwner.altImage)
  })

  it('Verify exapanded details for disable module', () => {
    createTx.clickOnTransactionItemByName(typeDisableOwner.title)
    createTx.verifyExpandedDetails([
      typeDisableOwner.description,
      typeDisableOwner.address,
      typeDisableOwner.transactionHash,
    ])
  })

  // Added to prod
  // Change threshold
  it('Verify summary for changing threshold', () => {
    createTx.verifySummaryByName(typeChangeThreshold.title, null, [typeGeneral.statusOk], typeChangeThreshold.altImage)
  })

  // Added to prod
  it('Verify exapanded details for changing threshold', () => {
    createTx.clickOnTransactionItemByName(typeChangeThreshold.title)
    createTx.verifyExpandedDetails(
      [
        typeChangeThreshold.requiredConfirmationsTitle,
        typeChangeThreshold.transactionHash,
      ],
      createTx.policyChangeWarning,
    )
    createTx.checkRequiredThreshold(2)
  })

  // Added to prod
  it('Verify that sender address of untrusted token will not be copied until agreed in warning popup', () => {
    createTx.clickOnTransactionItemByName(typeUntrustedToken.summaryTitle, typeUntrustedToken.summaryTxInfo)
    createTx.verifyAddressNotCopied(0, typeUntrustedToken.senderAddress)
  })

  it('Verify tx hashes are grouped in advanced details', () => {
    createTx.clickOnTransactionItemByName(typeDisableOwner.title)
    createTx.verifyExpandedDetails([
      typeDisableOwner.description,
      typeDisableOwner.address,
      typeDisableOwner.transactionHash,
    ])
    createTx.clickOnAdvancedDetails()
    createTx.checkHashesExist(3)
  })
})
