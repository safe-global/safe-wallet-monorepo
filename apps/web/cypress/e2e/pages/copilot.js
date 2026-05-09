import * as constants from '../../support/constants'
import { continueSignBtn, clickOnConfirmTransactionBtn } from './create_tx.pages'
import * as main from './main.page'
import * as walletUtils from '../../support/utils/wallet.js'
import safes from '../../fixtures/safes/static.js'

// Safe Shield Page Object

// ========================================
// Selectors
// ========================================

// Main Safe Shield widget (data-testid targets)
export const safeShieldWidget = '[data-testid="safe-shield-widget"]'
export const safeShieldStatusBar = '[data-testid="safe-shield-status"]'
export const TEST_RECIPIENT = '0x773B97f0b2D38Dbf5C8CbE04C2C622453500F3e0'
export const TEST_SAFE_ADDRESS = '0xb412684F4F0B5d27cC4A4D287F42595aB3ae124D'

// Analysis group cards
export const recipientAnalysisGroupCard = '[data-testid="recipient-analysis-group-card"]'
export const contractAnalysisGroupCard = '[data-testid="contract-analysis-group-card"]'
export const threatAnalysisGroupCard = '[data-testid="threat-analysis-group-card"]'
export const tenderlySimulation = '[data-testid="tenderly-simulation"]'
export const runSimulationBtn = '[data-testid="run-simulation-btn"]'

//no data-testids, accessed via class or structure
export const progressBar = '[role="progressbar"]'

// ========================================
// URL Constants
// ========================================
export const tenderlySimulationUrl = 'dashboard.tenderly.co/public/safe/safe-apps/simulator/'

// ========================================
// Test Transactions
// ========================================

// Transaction IDs for Safe Shield testing scenarios
export const testTransactions = {
  // Threat analysis test - transaction with threat analysis failure
  threatAnalysisFailed:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x531e49fc6655b8013148d08f0e669b91fc29ee23c9ab005948d93447eaef079b',
  // Threat analysis test - transaction with no threat detected
  threatAnalysisNoThreat:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xe329b8243ff94c02fa4d9fd382789d669cb5969efbce5e275635ce6d3577fa5e',
  // Threat analysis test - transaction with malicious approval (drainer contract)
  threatAnalysisMaliciousApproval:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x657afdcb7589bb4b6386c39d71692840f3f616c512401dff51bef1ccb46592d7',
  // Threat analysis test - transaction with malicious transfer (drainer contract)
  threatAnalysisMaliciousTransfer:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xc764a15c522af6477ebbe7d808a509806879a68bd097b8594e1437c71fb345f1',
  // Threat analysis test - transaction with malicious native currency transfer (drainer contract)
  threatAnalysisMaliciousNativeTransfer:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x1de5f38dde9d01705482a9fae07a82e90091a4d4683c148701858fd03d48db05',
  // Threat analysis test - transaction with malicious address (wallet_sendCalls)
  threatAnalysisMaliciousAddress:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x5727020cc864376612fba6ee8fd146a8d2e8b671857b22efc9ef45062f7a517f',
  // Threat analysis test - transaction with malicious address (wallet_sendCalls with Eth)
  threatAnalysisMaliciousAddressEth:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x228751aa0f0442baf8a670e3af8bbe93c22c7e9a0ad14527620f9a50b972f52c',
  // Tenderly simulation test - transaction for simulation testing
  tenderlySimulation:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xe329b8243ff94c02fa4d9fd382789d669cb5969efbce5e275635ce6d3577fa5e',
  // Recipient analysis test - transaction with low activity recipient (address has few transactions)
  recipientAnalysisLowActivity:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xc764a15c522af6477ebbe7d808a509806879a68bd097b8594e1437c71fb345f1',
  // Recipient analysis test - transaction for known/unknown/recurring recipient tests
  recipientAnalysisKnownUnknown:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0xe329b8243ff94c02fa4d9fd382789d669cb5969efbce5e275635ce6d3577fa5e',
  // Recipient analysis test - transaction where recipient is a Safe you own
  recipientAnalysisSafeYouOwn:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x32c4f7200e30fd4f23fdc9f1a22a041eb7a64144732a9bf83ff425ecc8dcdbb0',
  // Recipient analysis test - transaction with missing ownership warning
  recipientAnalysisMissingOwnership:
    '&id=multisig_0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B_0xa6974dc1f453da73dd5f090b637c91cc1a0bcb17307edb502fb8d8f552b52a4e',
  // Recipient analysis test - transaction with unsupported network warning
  recipientAnalysisUnsupportedNetwork:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x1d9fcb929ce160b4c51f658b9b849d6428c7acbbf5762f0635ee9831b21cad43',
  // Recipient analysis test - transaction with different setup warning
  recipientAnalysisDifferentSetup:
    '&id=multisig_0x65e1Ff7e0901055B3bea7D8b3AF457a659714013_0x2eb17f9f0d196d389f3130e7b9dca0de8d1f7ed60e1d9300aac21f13e9cf691b',
}

// ========================================
// Text Constants (used for assertions)
// ========================================

// Header status texts
const checksPassedStr = 'Checks passed'
const riskDetectedStr = 'Risk detected'
const issuesFoundStr = 'Issues found'
const analyzingStr = 'Analyzing...'
const checksUnavailableStr = 'Checks unavailable'
// Note: "Secured by" text was removed, now only the logo is displayed

// Error messages
const contractAnalysisFailedStr = 'Contract analysis failed'
const reviewBeforeProcessingStr = 'Contract analysis failed. Review before processing.'

// Empty state message
const emptyStateStr = 'Transaction details will be automatically scanned for potential risks and will appear here.'

// Threat messages
const maliciousThreatStr = 'Malicious threat detected'
const threatAnalysisFailedStr = 'Threat analysis failed'
const threatReviewBeforeProcessingStr = 'Threat analysis failed. Review before processing'
const noThreatDetectedStr = 'No threat detected'
const threatAnalysisFoundNoIssuesStr = 'Threat analysis found no issues'
export const maliciousApprovalMessageStr = 'The transaction approves erc20 tokens to a known malicious address'
export const maliciousTransferMessageStr = 'The transaction transfers tokens to a known malicious address'
export const maliciousNativeTransferMessageStr =
  'The transaction transfers native currency to a known malicious address'
export const maliciousAddressMessageStr = 'The transaction contains a known malicious address'
export const maliciousActivityStr = 'This address has recorded malicious activity'
export const drainerActivityStr = 'This address shows a wallet drainer behavior or patterns'
export const drainerApprovalMessageStr = 'The transaction approves erc20 tokens to a known drainer contract'
export const drainerTransferMessageStr = 'The transaction transfers tokens to a known drainer contract'
export const drainerNativeTransferMessageStr = 'The transaction transfers native currency to a known drainer contract'

// Recipient analysis messages
export const lowActivityRecipientStr = 'Low activity recipient'
export const recurringRecipientStr = 'Recurring recipient'
export const unknownRecipientStr = 'Unknown recipient'
export const addressInAddressBookStr = 'This address is in your address book'
export const addressNotInAddressBookStr = 'This address is not in your address book or a Safe you own'
export const addressIsSafeYouOwnStr = 'This address is a Safe you own'
export const fewTransactionsStr = 'This address has few transactions'
export const firstTimeInteractionStr = 'You are interacting with this address for the first time'
export const interactedTwoTimesStr = 'You have interacted with this address 2 times'
export const missingOwnershipStr = 'Missing ownership'
export const missingOwnershipMessageStr =
  'This Safe account is not activated on the target chain. First, create the Safe, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.'
export const unsupportedNetworkStr = 'Unsupported network'
export const unsupportedNetworkMessageStr =
  'app.safe.global does not support the network. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.'
export const differentSetupMessageStr =
  'Your Safe exists on the target chain but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.'
// ========================================
// Helper Functions
// ========================================

// Verify Safe Shield widget is displayed
export function verifySafeShieldDisplayed() {
  cy.get(safeShieldWidget).should('be.visible')
}

// Verify Safe Shield logo footer is displayed
export function verifySecuredByFooter() {
  // Check for the Safe Shield logo SVG icon
  cy.get('[data-testid="safe-shield-widget"]').find('.MuiSvgIcon-root').should('be.visible')
}

// Verify status shows "Checks passed"
export function verifyChecksPassed() {
  cy.contains(checksPassedStr).should('be.visible')
}

// Verify status shows "Risk detected"
export function verifyRiskDetected() {
  cy.contains(riskDetectedStr).should('be.visible')
}

// Verify status shows "Issues found"
export function verifyIssuesFound() {
  cy.contains(issuesFoundStr).should('be.visible')
}

// Verify status shows "Analyzing..."
export function verifyAnalyzing() {
  cy.contains(analyzingStr).should('be.visible')
}

// Verify status shows "Checks unavailable"
export function verifyChecksUnavailable() {
  cy.contains(checksUnavailableStr).should('be.visible')
}

// Verify loading state with progress bar
export function verifyLoadingState() {
  cy.get(progressBar).should('be.visible')
}

// Verify loading state is not displayed
export function verifyNotLoading() {
  cy.get(progressBar).should('not.exist')
}

// Verify empty state message is displayed
export function verifyEmptyState() {
  cy.contains(emptyStateStr).should('be.visible')
}

// Verify empty state is not displayed
export function verifyNotEmptyState() {
  cy.contains(emptyStateStr).should('not.exist')
}

// Verify contract analysis failed error
export function verifyContractAnalysisError() {
  main.verifyTextVisibility([contractAnalysisFailedStr, reviewBeforeProcessingStr])
}

// Verify malicious threat detected message
export function verifyMaliciousThreat() {
  cy.contains(maliciousThreatStr).should('be.visible')
}

/**
 * Wait for Safe Shield analysis to complete
 * @param {number} timeout - Timeout in milliseconds (default 10000)
 */
export function waitForAnalysisComplete(timeout = 10000) {
  // Wait for "Analyzing..." to disappear
  cy.contains(analyzingStr, { timeout }).should('not.exist')
}

/**
 * Verify Safe Shield widget contains specific text
 * @param {string} text - Text to search for
 */
export function verifyWidgetContainsText(text) {
  cy.get(safeShieldWidget).should('contain', text)
}

// Verify Safe Shield header shows Issues found
export function verifyIssuesFoundWarningHeader() {
  cy.get(safeShieldStatusBar).should('contain.text', issuesFoundStr)
}

// Verify recipient analysis group card is displayed
export function verifyRecipientAnalysisGroupCard() {
  cy.get(recipientAnalysisGroupCard).should('be.visible')
}

// Verify contract analysis group card is displayed
export function verifyContractAnalysisGroupCard() {
  cy.get(contractAnalysisGroupCard).should('be.visible')
}

// Verify threat analysis group card is displayed
export function verifyThreatAnalysisGroupCard() {
  cy.get(threatAnalysisGroupCard).should('be.visible')
}

// Verify threat analysis warning icon and state
export function verifyThreatAnalysisWarningState() {
  cy.get(threatAnalysisGroupCard).should('contain.text', threatAnalysisFailedStr)
}

// Verify Tenderly simulation group card is displayed
export function verifyTenderlySimulation() {
  cy.get(tenderlySimulation).should('be.visible')
}

// Expand threat analysis card
export function expandThreatAnalysisCard() {
  cy.get(threatAnalysisGroupCard).click()
}

// Verify threat analysis failed details
export function verifyThreatAnalysisFailedDetails() {
  main.verifyTextVisibility([threatAnalysisFailedStr, threatReviewBeforeProcessingStr])
}

// Verify threat analysis shows no threat detected state
export function verifyThreatAnalysisNoThreatState() {
  cy.get(threatAnalysisGroupCard).should('contain.text', noThreatDetectedStr)
}

// Verify threat analysis found no issues details
export function verifyThreatAnalysisFoundNoIssues() {
  main.verifyTextVisibility([threatAnalysisFoundNoIssuesStr])
}

// Verify threat analysis shows malicious threat detected state
export function verifyThreatAnalysisMaliciousState() {
  cy.get(threatAnalysisGroupCard).should('contain.text', maliciousThreatStr)
}

// ========================================
// Risk Confirmation Selectors
// ========================================

export const riskConfirmationCheckbox = '[data-testid="risk-confirmation-checkbox"]'

// ========================================
// Risk Confirmation Functions
// ========================================

// Verify risk confirmation checkbox is visible and unchecked
export function verifyRiskConfirmationCheckboxUnchecked() {
  cy.get(riskConfirmationCheckbox).scrollIntoView().should('be.visible')
  cy.get(riskConfirmationCheckbox).find('input[type="checkbox"]').should('not.be.checked')
}

// Check the risk confirmation checkbox
export function checkRiskConfirmationCheckbox() {
  cy.get(riskConfirmationCheckbox).scrollIntoView().find('input[type="checkbox"]').check()
}

//Verify continue button is disabled

export function verifyContinueButtonDisabled() {
  main.verifyBtnIsDisabled(continueSignBtn)
}

// Verify continue button is enabled
export function verifyContinueButtonEnabled() {
  main.verifyBtnIsEnabled(continueSignBtn)
}

// ========================================
// Recipient Analysis Functions
// ========================================

// Expand recipient analysis card
export function expandRecipientAnalysisCard() {
  cy.get(recipientAnalysisGroupCard).click()
}

// ========================================
// Navigation and Setup Functions
// ========================================

/**
 * Navigate to a transaction and set up the Copilot flow
 * @param {string} transactionId - Transaction ID (e.g., '&id=multisig_0x...')
 * @param {string} signer - Private key for wallet connection
 * @param {object} addressBookData - Optional address book data to set in localStorage before navigation
 * @param {string} safeAddress - Optional Safe address (defaults to MATIC_STATIC_SAFE_30)
 */
export function navigateToTransactionAndSetupCopilot(
  transactionId,
  signer,
  addressBookData = null,
  safeAddress = null,
) {
  // Clear localStorage to ensure clean state
  cy.clearLocalStorage()

  // Use provided safeAddress or default to MATIC_STATIC_SAFE_30
  const safe = safeAddress || safes.MATIC_STATIC_SAFE_30

  // Set up localStorage before navigation if address book data is provided
  if (addressBookData) {
    cy.visit(constants.transactionUrl + safe + transactionId, {
      onBeforeLoad: (win) => {
        win.localStorage.setItem(constants.localStorageKeys.SAFE_v2__addressBook, JSON.stringify(addressBookData))
      },
    })
  } else {
    cy.visit(constants.transactionUrl + safe + transactionId)
  }

  walletUtils.connectSigner(signer)

  clickOnConfirmTransactionBtn()
  verifySafeShieldDisplayed()
  waitForAnalysisComplete()
}

/**
 * Set up recipient analysis test flow (extends navigateToTransactionAndSetupCopilot)
 * @param {string} transactionId - Transaction ID
 * @param {string} signer - Private key for wallet connection
 * @param {object} addressBookData - Optional address book data
 * @param {string} safeAddress - Optional Safe address
 */
export function setupRecipientAnalysis(transactionId, signer, addressBookData = null, safeAddress = null) {
  navigateToTransactionAndSetupCopilot(transactionId, signer, addressBookData, safeAddress)
  verifyRecipientAnalysisGroupCard()
  expandRecipientAnalysisCard()
}
