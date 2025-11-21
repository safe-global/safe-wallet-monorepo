import * as constants from '../../support/constants'

// Safe Shield Page Object

// ========================================
// Selectors
// ========================================

// Main Safe Shield widget (only element with data-testid)
export const safeShieldWidget = '[data-testid="safe-shield-widget"]'
export const TEST_RECIPIENT = '0x773B97f0b2D38Dbf5C8CbE04C2C622453500F3e0'
export const TEST_SAFE_ADDRESS = '0xb412684F4F0B5d27cC4A4D287F42595aB3ae124D'

//no data-testids, accessed via class or structure
export const progressBar = '[role="progressbar"]'

// ========================================
// Text Constants (used for assertions)
// ========================================

// Header status texts
const checksPassedStr = 'Checks passed'
const riskDetectedStr = 'Risk detected'
const issuesFoundStr = 'Issues found'
const analyzingStr = 'Analyzing...'
const checksUnavailableStr = 'Checks unavailable'
const securedByStr = 'Secured by'

// Error messages
const contractAnalysisFailedStr = 'Contract analysis failed'
const reviewBeforeProcessingStr = 'Contract analysis failed. Review before processing.'

// Empty state message
const emptyStateStr = 'Transaction details will be automatically scanned for potential risks and will appear here.'

// Threat messages
const maliciousThreatStr = 'Malicious threat detected'

// ========================================
// Helper Functions
// ========================================

/**
 * Verify Safe Shield widget is displayed
 */
export function verifySafeShieldDisplayed() {
  cy.get(safeShieldWidget).should('be.visible')
}

/**
 * Verify "Secured by" footer is displayed
 */
export function verifySecuredByFooter() {
  cy.contains(securedByStr).should('be.visible')
}

/**
 * Verify status shows "Checks passed"
 */
export function verifyChecksPassed() {
  cy.contains(checksPassedStr).should('be.visible')
}

/**
 * Verify status shows "Risk detected"
 */
export function verifyRiskDetected() {
  cy.contains(riskDetectedStr).should('be.visible')
}

/**
 * Verify status shows "Issues found"
 */
export function verifyIssuesFound() {
  cy.contains(issuesFoundStr).should('be.visible')
}

/**
 * Verify status shows "Analyzing..."
 */
export function verifyAnalyzing() {
  cy.contains(analyzingStr).should('be.visible')
}

/**
 * Verify status shows "Checks unavailable"
 */
export function verifyChecksUnavailable() {
  cy.contains(checksUnavailableStr).should('be.visible')
}

/**
 * Verify loading state with progress bar
 */
export function verifyLoadingState() {
  cy.get(progressBar).should('be.visible')
}

/**
 * Verify loading state is not displayed
 */
export function verifyNotLoading() {
  cy.get(progressBar).should('not.exist')
}

/**
 * Verify empty state message is displayed
 */
export function verifyEmptyState() {
  cy.contains(emptyStateStr).should('be.visible')
}

/**
 * Verify empty state is not displayed
 */
export function verifyNotEmptyState() {
  cy.contains(emptyStateStr).should('not.exist')
}

/**
 * Verify contract analysis failed error
 */
export function verifyContractAnalysisError() {
  cy.contains(contractAnalysisFailedStr).should('be.visible')
  cy.contains(reviewBeforeProcessingStr).should('be.visible')
}

/**
 * Verify malicious threat detected message
 */
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

/**
 * Verify specific text is visible anywhere in the page
 * @param {string} text - Text to search for
 */
export function verifyTextVisible(text) {
  cy.contains(text).should('be.visible')
}

/**
 * Verify specific text is not visible
 * @param {string} text - Text to search for
 */
export function verifyTextNotVisible(text) {
  cy.contains(text).should('not.exist')
}
