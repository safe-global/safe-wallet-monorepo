import * as constants from '../../support/constants.js'
import * as safeapps from './safeapps.pages.js'
import * as main from './main.page.js'
import * as createtx from './create_tx.pages.js'
import staticSafes from '../../fixtures/safes/static.js'

const transactionQueueStr = 'Pending transactions'
const noTransactionStr = 'This Safe has no queued transactions'
const overviewStr = 'Total'
const sendStr = 'Send'
const receiveStr = 'Receive'
const viewAllStr = 'View all'
const explorePossibleStr = "Explore what's possible"
const swapSuggestion = 'Swap tokens instantly'

const copyShareBtn = '[data-testid="copy-btn-icon"]'
const exploreAppsBtn = '[data-testid="explore-apps-btn"]'
const viewAllLink = '[data-testid="view-all-link"][href^="/transactions/queue"]'
const noTxText = '[data-testid="no-tx-text"]'
const actionRequiredPanel = '[data-testid="action-required-panel"]'
const actionRequiredPanelToggle = '[data-testid="action-required-panel-toggle"]'
const actionRequiredPanelContent = '[data-testid="action-required-panel-content"]'
export const pendingTxWidget = '[data-testid="pending-tx-widget"]'
export const pendingTxItem = '[data-testid="tx-pending-item"]'
export const assetsWidget = '[data-testid="assets-widget"]'
const singleTxDetailsHeader = '[data-testid="tx-details"]'
// Case #1 — Outdated official mastercopy (Info) → "Update"
export const outdatedOfficialTitlePrefix = 'New Safe version is available'
export const outdatedOfficialContent =
  'Update now to take advantage of new features and the highest security standards available. You will need to confirm this update just like any other transaction.'
export const mastercopyActions = {
  update: 'Update',
  migrate: 'Migrate',
  getCli: 'Get CLI',
}

// Case #2 & #3 — Unsupported mastercopy (Warning)
export const unsupportedMastercopyTitle = 'This Safe is running an unsupported version'
export const unsupportedMigratableContent =
  'and may miss security fixes and improvements. You should migrate it to a compatible version.'
export const unsupportedCliContent =
  'and may miss security fixes and improvements. You must use our CLI tool to migrate.'

const migrateSafeSubtitle = 'Update Safe Account base contract'
export const nonPinnedWarningTitle = 'Not in your trusted list'
export const trustThisSafeButtonLabel = 'Trust this Safe'
const trustDialogTestId = '[data-testid="add-trusted-safe-dialog"]'

export function clickOnTxByIndex(index) {
  // Wait for hydration to set the correct safe query param in the link href
  cy.get(pendingTxItem)
    .eq(index)
    .should('have.attr', 'href')
    .and('match', /safe=.{3,}/)
  cy.get(pendingTxItem).eq(index).click()
  cy.get(singleTxDetailsHeader).should('be.visible')
}

export function verifySingleTxItem(data) {
  main.checkTextsExistWithinElement(createtx.transactionItem, data)
}

export function verifyDataInPendingTx(data) {
  main.checkTextsExistWithinElement(pendingTxWidget, data)
}

export function verifyTxItemInPendingTx(data) {
  let matchFound = false

  cy.get(pendingTxItem)
    .each(($item) => {
      const itemText = $item.text()
      const isMatch = data.every((tx) => itemText.includes(tx))

      if (isMatch) {
        matchFound = true
        return false
      }
    })
    .then(() => {
      expect(matchFound).to.be.true
    })
}

export function verifyEmptyTxSection() {
  main.verifyElementsIsVisible([noTxText])
}

export function clickOnViewAllBtn() {
  cy.get(viewAllLink).click()
}

export function pinAppByIndex(index) {
  return cy
    .get('[aria-label*="Pin"]')
    .eq(index)
    .click()
    .then(() => {
      cy.wait(1000)
      return cy.get('[aria-label*="Unpin"]').eq(0).invoke('attr', 'aria-label')
    })
}

export function clickOnPinBtnByName(name) {
  cy.get(`[aria-label="${name}"]`).click()
}

export function verifyPinnedAppsCount(count) {
  cy.get(`[aria-label*="Unpin"]`).should('have.length', count)
}

export function clickOnExploreAppsBtn() {
  cy.get(exploreAppsBtn).click()
  cy.get(safeapps.safeAppsList)
    .should('exist')
    .within(() => {
      cy.get('li').should('have.length.at.least', 1)
    })
}

export function verifyShareBtnWorks(index, data) {
  cy.get(copyShareBtn)
    .eq(index)
    .click()
    .wait(1000)
    .then(() =>
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          expect(text).to.contain(data)
        })
      }),
    )
}

export function verifyOverviewWidgetData() {
  // Alias for the Overview section
  cy.contains('div', overviewStr).parents('section').as('overviewSection')

  cy.get('@overviewSection').within(() => {
    // Prefix is separated across elements in EthHashInfo
    cy.get('button').contains(sendStr)
    cy.get('button').contains(receiveStr)
  })
}

export function verifyTxQueueWidget() {
  // Alias for the Transaction queue section
  cy.contains('p', transactionQueueStr).parents('section').as('txQueueSection')

  cy.get('@txQueueSection').within(() => {
    // There should be queued transactions
    cy.contains(noTransactionStr).should('not.exist')

    // Queued txns
    cy.contains(
      `a[href^="/transactions/tx?id=multisig_0x"]`,
      'Send' + `-0.00002 ${constants.tokenAbbreviation.sep}`,
    ).should('exist')

    cy.contains(`a[href^="/transactions/tx?id=multisig_0x"]`, '1/1').should('exist')

    cy.contains(
      `a[href="${constants.transactionQueueUrl}${encodeURIComponent(staticSafes.SEP_STATIC_SAFE_2)}"]`,
      viewAllStr,
    )
  })
}

export function verifyExplorePossibleSection() {
  cy.contains('h2', explorePossibleStr).parents('section').as('explorePossibleSection')
  cy.get('@explorePossibleSection').contains(swapSuggestion)
}

export function expandActionRequiredPanel() {
  cy.get(actionRequiredPanel, { timeout: 30000 }).should('be.visible')
  cy.get(actionRequiredPanelToggle).click()
  cy.get(actionRequiredPanelContent, { timeout: 10000 }).should('be.visible')
}

/**
 * Verify the action required panel shows the expected message count.
 * @param {number} expectedCount - Expected count displayed in the panel badge
 */
export function verifyActionRequiredPanelCount(expectedCount) {
  cy.get(actionRequiredPanel, { timeout: 30000 }).should('be.visible')
  cy.get(actionRequiredPanel).contains('Action required').should('be.visible')
  cy.get(actionRequiredPanel).invoke('text').should('include', String(expectedCount))
}

/**
 * Verify a card in the action required panel by message(s) and/or action label.
 * Uses main.verifyValuesExist for message verification (elements inside panel).
 * @param {Object} options
 * @param {boolean} [options.expandFirst=true] - Expand the panel before verifying
 * @param {string[]} [options.messages=[]] - Text(s) that must be visible in the card (title, content)
 * @param {string} [options.actionLabel] - Text on the action button/link to verify visible
 */
export function verifyActionRequiredCard({ expandFirst = true, messages = [], actionLabel } = {}) {
  if (expandFirst) {
    expandActionRequiredPanel()
  }
  if (messages.length > 0) {
    main.verifyValuesExist(actionRequiredPanel, messages)
  }
  if (actionLabel) {
    cy.get(actionRequiredPanel).within(() => {
      cy.contains('button, a', actionLabel).should('be.visible')
    })
  }
}

/**
 * Click an action (button or link) in the action required panel by its label text.
 * @param {string} actionLabel - Text on the button/link to click
 */
export function clickActionInPanel(actionLabel) {
  cy.get(actionRequiredPanel).within(() => {
    cy.contains('button, a', actionLabel).click()
  })
}

export function verifyMigrateSafeFlowOpened() {
  cy.contains(migrateSafeSubtitle, { timeout: 30000 }).should('be.visible')
}

const getCliLinkTestId = '[data-testid="get-cli-link"]'

/** Verifies the "Get CLI" link is visible in the action required panel (Case #3). */
export function verifyGetCliLinkInPanel() {
  cy.get(actionRequiredPanel).within(() => {
    cy.get(getCliLinkTestId, { timeout: 10000 }).should('be.visible')
  })
}

export function verifyTrustDialogVisible() {
  cy.get(trustDialogTestId, { timeout: 15000 }).should('be.visible')
}
