import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import * as navigation from './navigation.page.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

export const orgList = '[data-testid="org-list"]'
export const createSpaceBtn = '[data-testid="create-space-button"]'
export const createSpaceModalBtn = '[data-testid="create-space-modal-button"]'
export const orgSpaceInput = '[data-testid="space-name-input"]'
export const orgName = '[data-testid="org-name"]'
export const spaceSelectorBtn = '[data-testid="space-selector-button"]'
export const spaceSelectorMenu = '[data-testid="space-selector-menu"]'
const spaceEditInput = 'input[name="name"]'
const spaceSaveBtn = '[data-testid="space-save-button"]'
const updateSuccessMsg = 'Updated space name'
const spaceDeleteBtn = '[data-testid="space-delete-button"]'
const spaceConfirmDeleteBtn = '[data-testid="space-confirm-delete-button"]'
// const orgAddManuallyBtn = '[data-testid="add-manually-button"]'
const addSpaceAccountBtn = '[data-testid="add-space-account-button"]'
const addSpaceAccountManuallyBtn = '[data-testid="add-space-account-manually-button"]'
const addSpaceAccountManuallyModalBtn = '[data-testid="add-manually-button"]'

const contectMenuRemoveBtn = '[data-testid="remove-button"]'
const spaceCard = '[data-testid="space-card"]'
const spaceVertMenuIcon = '[data-testid="MoreVertIcon"]'
const addAddressInput = '[data-testid="add-address-input"]'
const netwrokSelector = '[data-testid="network-selector"]'
const netwrokItem = '[data-testid="network-item"]'
export const dashboardSafeList = '[data-testid="dashboard-safe-list"]'
/** Same pattern as `dashboard.pages.js` `pendingTxWidget` — root `data-testid` on the Space dashboard widget. */
export const spaceDashboardAccountsWidget = '[data-testid="space-dashboard-accounts-widget"]'
/** Indexed rows: `space-dashboard-accounts-row-0`, `space-dashboard-accounts-row-1`, … */
export const spaceDashboardAccountsRowSelector = '[data-testid^="space-dashboard-accounts-row-"]'
export const pendingTxWidget = '[data-testid="space-dashboard-pending-widget"]'
export const widgetItem = '[data-slot="widget-item"]'
export const spaceDashboardTotalValue = '[data-testid="space-dashboard-total-value"]'
export const spaceDashboardTotalValueLabelText = 'Total value'
const addAccountsBtn = '[data-testid="add-accounts-button"]'
const addMemberBtn = '[data-testid="add-member-button"]'
const addMemberModalBtn = '[data-testid="add-member-modal-button"]'
const memberAddressInput = '[data-testid="member-address-input"]'
const memberNameInput = '[data-testid="member-name-input"]'
const acceptInviteBtn = '[data-testid="accept-invite-button"]'
const inviteNameInput = '[data-testid="invite-name-input"]'
const confirmAcceptInviteBtn = '[data-testid="confirm-accept-invite-button"]'

// export const createSpaceBtn = '[data-testid="create-space-button"]'

export function confirmAcceptInvite() {
  cy.get(confirmAcceptInviteBtn).click()
}

export function typeInviteName(name) {
  cy.get(inviteNameInput).find('input').clear().type(name)
}

export function acceptInvite(name) {
  cy.get(acceptInviteBtn).click()
  typeInviteName(name)
  confirmAcceptInvite()
  cy.contains(name).should('be.visible')
}

export function clickOnSignInBtn() {
  cy.contains('Sign in with').click()
}

export function clickOnCreateSpaceBtn() {
  cy.get(createSpaceBtn).should('be.enabled').click()
}

export function clickOnCreateSpaceModalBtn() {
  cy.get(createSpaceModalBtn).should('be.enabled').click()
}

export function typeSpaceName(name) {
  cy.get(orgSpaceInput).clear().type(name)
}

export function clickOnSpaceSelector() {
  cy.get(spaceSelectorBtn, { timeout: 15000 }).should('be.visible').click()
}

export function spaceExists(name) {
  cy.get(spaceSelectorMenu).contains(name).should('be.visible')
}

export function getSpaceId() {
  return cy.url().then((url) => {
    const match = url.match(/spaceId=(\d+)/)
    if (!match) {
      throw new Error('spaceId not found in the URL')
    }
    return match[1]
  })
}

/** Opens the Space home dashboard for a CGW space id (query: `spaceId=`). */
export function visitSpaceDashboard(spaceId) {
  cy.visit(constants.spaceDashboardUrl + String(spaceId))
}

/** Intl fiat string: `$` + optional thin space + digits/commas + `.` + two fraction digits (e.g. `$874.84`, `$1,234.56`). */
const formattedSpaceTotalValuePattern = /^\$[\u200a\s]*[\d,]+\.\d{2}$/

export function verifySpaceDashboardTotalValueFormat() {
  main.verifyTextVisibility([spaceDashboardTotalValueLabelText])
  cy.get(spaceDashboardTotalValue, { timeout: 30000 })
    .should('be.visible')
    .invoke('text')
    .should('match', formattedSpaceTotalValuePattern)
}

const spaceDashboardWidgetSelectorByTitle = {
  Accounts: spaceDashboardAccountsWidget,
  Pending: pendingTxWidget,
}

/** Asserts the Accounts or Pending widget mount (cf. `dashboard.verifyPendingTxWidgetVisible`). */
export function verifySpaceDashboardWidgetVisible(widgetTitle) {
  const selector = spaceDashboardWidgetSelectorByTitle[widgetTitle]
  if (!selector) {
    throw new Error(`Unknown space dashboard widget title: ${widgetTitle}`)
  }
  cy.get(selector, { timeout: 30000 }).should('be.visible')
}

export function getAccountItem(index) {
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-row-${index}"]`
}

/** Expanded panel under a multichain `ExpandableAccountItem` (after trigger click). */
export function getAccountExpandedPanel(rowIndex) {
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-expanded-${rowIndex}"]`
}

/** One per-chain row inside the expanded multichain panel (`ExpandableAccountItem`). */
export function getSubAccountRow(chainId) {
  return `${spaceDashboardAccountsWidget} [data-testid="sub-account-row-${chainId}"]`
}

/**
 * Asserts how many top-level account rows the Accounts widget renders (uses `main.verifyElementsCount`).
 * @param {number} expectedCount — Last row index is `expectedCount - 1` (`getAccountItem(n)`).
 */
export function verifySpaceDashboardAccountsWidgetRowCount(expectedCount) {
  main.verifyElementsCount(`${spaceDashboardAccountsWidget} ${spaceDashboardAccountsRowSelector}`, expectedCount)
}

/** `AccountWidgetItem` — scoped under `space-dashboard-accounts-row-${n}`. */
export const spaceDashboardAccountsRowName = '[data-testid="space-dashboard-accounts-row-name"]'
export const spaceDashboardAccountsRowAddress = '[data-testid="space-dashboard-accounts-row-address"]'
export const spaceDashboardAccountsRowIdenticon = '[data-testid="space-dashboard-accounts-row-identicon"]'
export const spaceDashboardAccountsRowChainLogos = '[data-testid="space-dashboard-accounts-row-chain-logos"]'
export const spaceDashboardAccountsRowBalance = '[data-testid="space-dashboard-accounts-row-balance"]'
export const spaceDashboardAccountsRowThreshold = '[data-testid="space-dashboard-accounts-row-threshold"]'
/** `ChainIndicator` network logo `<img>` (inside `space-dashboard-accounts-row-chain-logos` or tooltip). */
export const chainIndicatorNetworkLogoImg = '[data-testid="chain-indicator-network-logo-img"]'

/**
 * FiatValue text for the Pending tx row (whole dollars or with decimals depending on settings).
 * @type {RegExp}
 */
export const pendingTxSafeBalanceRegex = /\$[\u200a\s]*875(?:\.\d{2})?/

/**
 * Asserts single-chain `AccountWidgetItem` row content via `data-testid` only (values compared with expected strings / regex).
 * Reuses `main.shortenAddress` for the displayed address (same as `AccountWidgetItem`).
 *
 * @param {number} rowIndex — 0-based (`getAccountItem(rowIndex)`).
 * @param {{ name: string, address: string, balanceRegex: RegExp, ownersThreshold?: string }} expected — pass `ownersThreshold` (e.g. `2/3`) when the row shows the owners badge; omit for multichain / expandable rows.
 */
export function verifySpaceDashboardAccountsRowSafeDetails(rowIndex, { name, address, balanceRegex, ownersThreshold }) {
  const row = getAccountItem(rowIndex)
  cy.get(row)
    .should('be.visible')
    .within(() => {
      cy.get(spaceDashboardAccountsRowName).should('be.visible').and('contain.text', name)
      cy.get(spaceDashboardAccountsRowAddress).should('be.visible').and('contain.text', main.shortenAddress(address))
      cy.get(spaceDashboardAccountsRowIdenticon).should('be.visible')
      cy.get(spaceDashboardAccountsRowChainLogos).find(chainIndicatorNetworkLogoImg).should('be.visible')
      cy.get(spaceDashboardAccountsRowBalance).invoke('text').should('match', balanceRegex)
      if (ownersThreshold !== undefined) {
        cy.get(spaceDashboardAccountsRowThreshold).should('be.visible').and('contain.text', ownersThreshold)
      }
    })
}

export function getPendingTxItem(index) {
  return `${pendingTxWidget} ${widgetItem}:eq(${index})`
}

/** Space-context Safe bar — `SpaceChainSelector` + `ChainSelectorBlock` trigger (`ChainLogo` / `ChainIndicator`). */
export const spaceChainSelector = '[data-testid="space-chain-selector"]'

/** Space-context Safe header — `SafeSelectorTriggerContent` (after navigating to `/home?safe=…`). */
export const safeSelectorTriggerDetails = '[data-testid="safe-selector-trigger-details"]'
export const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
export const safeSelectorTriggerAddress = '[data-testid="safe-selector-trigger-address"]'

/**
 * Asserts `safe` query matches the expected EIP-3770 value (e.g. `sep:0x…`).
 * Uses `URL.searchParams` so encoded `:` (`%3A`) is handled without manual decoding.
 * @param {string} expectedSafeParam — e.g. `sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb`
 */
export function verifySafeDashboardUrlSafeQuery(expectedSafeParam) {
  cy.url({ timeout: 30000 }).should('include', '/home')
  cy.url().should((href) => {
    expect(new URL(href).searchParams.get('safe'), 'safe query param').to.eq(expectedSafeParam)
  })
}

/**
 * Asserts `SpaceChainSelector` shows the current chain logo and `SafeSelectorTriggerContent` shows the expected name and prefixed short address (same as app `formatPrefixedAddress(shortenAddress(addr), chainShortName)`).
 * @param {{ expectedName: string, fullAddress: string, chainShortName: string }} opts
 */
export function verifySafeSelectorNavigationPanel({ expectedName, fullAddress, chainShortName }) {
  const short = main.shortenAddress(fullAddress)
  const expectedLine = `${chainShortName}:${short}`
  cy.get(spaceChainSelector, { timeout: 30000 })
    .should('be.visible')
    .find(chainIndicatorNetworkLogoImg)
    .should('be.visible')
  cy.get(safeSelectorTriggerName, { timeout: 30000 }).should('be.visible').and('contain.text', expectedName)
  cy.get(safeSelectorTriggerAddress).should('be.visible').and('contain.text', expectedLine)
}

/**
 * After clicking an Accounts widget row: `/home?safe=…` and Safe selector header (name + `chain:shortAddress` line).
 * @param {{ safeFullQuery: string, expectedName: string, fullAddress: string, chainShortName: string }} opts
 */
export function verifyOpenedSafeDashboardFromSpaceAccountsRow({
  safeFullQuery,
  expectedName,
  fullAddress,
  chainShortName,
}) {
  verifySafeDashboardUrlSafeQuery(safeFullQuery)
  verifySafeSelectorNavigationPanel({ expectedName, fullAddress, chainShortName })
}

export const sidebarItemHome = '[data-testid="sidebar-item-home"]'
export const sidebarItemAccounts = '[data-testid="sidebar-item-accounts"]'
export const sidebarItemAddressBook = '[data-testid="sidebar-item-address-book"]'
export const sidebarItemTeam = '[data-testid="sidebar-item-team"]'
export const sidebarItemSettings = '[data-testid="sidebar-item-settings"]'

export function verifySidebarItemNavigates(sidebarSelector, pathFragment) {
  cy.get(sidebarSelector).should('be.visible').click()
  cy.url().should('include', pathFragment)
}

export const backToSpaceBtn = '[data-testid="back-to-space-button"]'

export function disconnectFromSpaceLevel() {
  navigation.clickOnWalletExpandMoreIcon()
  navigation.clickOnDisconnectBtn()
}

export const viewAllAccountsLabel = 'View all accounts'
export const txDetailsLabel = 'Transaction details'
export const gettingStartedLabel = 'Getting started'
export const addSafeAccountsLabel = 'Add your Safe Accounts'
export const addAccountBtn = '[data-testid="add-space-account-button"]'
export const addAccountsModalLabel = 'Add Safe Accounts'
export const importAddressBookBtn = '[aria-label="Import address book"]'
export const importAddressBookLabel = 'Import address book'
export const dashboardAddMemberBtn = '[data-testid="add-member-button"]'
export const inviteMemberLabel = 'Add member'
export const learnMoreBtn = '[data-testid="spaces-learn-more-button"]'
/** Copy on `SpaceInfoModal` when opening Learn more from the empty dashboard CTA. */
export const exploreSpacesLabel = 'Introducing spaces'

export { staticSpaces }

/** Staging regression assertions for `spaces_dashboard.cy.js` — update when CGW data changes. */
export const firstAccountAddress = '0x1694CbDE1b30eEdd9f7A2b6C7e36A180F2a3a23C7'
/** Row index for `firstAccountAddress` when row 0 is another Safe (e.g. “Pending tx”). */
export const unnamedAccountRowIndex = 2
export const secondAccountName = 'Space addressbook name'
/** Shortened display is enough for the row assertion; full address must match CGW. */
export const secondAccountAddressPrefix = '0x0596'
export const secondAccountAddressSuffix = '197b'
export const pendingTxName = 'Send'
export const pendingTxStatus = 'Needs confirmation'

export function goToSpaceSettings() {
  getSpaceId().then((spaceId) => {
    cy.visit(constants.spaceUrl + spaceId)
  })
}

export function goToSpaceMembers() {
  cy.wait(1000)
  getSpaceId().then((spaceId) => {
    cy.visit(constants.spaceMembersUrl + spaceId)
  })
}

export function clickOnSaveSpaceNameBtn() {
  cy.get(spaceSaveBtn).click()
}

export function editSpace(newName) {
  cy.get(spaceEditInput).clear().type(newName)
  clickOnSaveSpaceNameBtn()
  cy.contains(updateSuccessMsg).should('be.visible')
}

export const deleteSpaceConfirmationMsg = (name) => `Deleted space ${name}`
const noSpacesStr = 'No spaces found'

export function deleteAllSpaces() {
  cy.wait(2000)
  cy.get('body').then(($body) => {
    if ($body.find(spaceCard).length > 0) {
      cy.get(spaceCard).then(($items) => {
        for (let i = $items.length - 1; i >= 0; i--) {
          cy.wrap($items[i]).within(() => {
            cy.get(spaceVertMenuIcon).click({ force: true })
          })
          cy.get(contectMenuRemoveBtn).click({ force: true })
          cy.get(spaceConfirmDeleteBtn).click()
          deleteAllSpaces()
        }
      })
    }
  })
}

/**
 * Ensures the app is ready to create a space. Handles two post-login states:
 * - If spaces exist: deletes all spaces and verifies Create space button is visible.
 * - If no spaces: verifies Create space button is visible on the "No spaces found" page.
 */
export function ensureReadyToCreateSpace() {
  cy.wait(2000)
  cy.get('body').then(($body) => {
    const hasSpaces = $body.find(spaceCard).length > 0
    if (hasSpaces) {
      deleteAllSpaces()
    }
    main.verifyElementsIsVisible([createSpaceBtn])
  })
}

export function deleteSpace(name) {
  cy.get(spaceDeleteBtn).click({ force: true })
  cy.get(spaceConfirmDeleteBtn).click()
  cy.contains(noSpacesStr).should('be.visible')
}

export function clickOnAddAccountBtn() {
  cy.get(addSpaceAccountBtn).should('be.enabled').click()
}

export function clickOnAddAccountsBtn() {
  cy.get(addAccountsBtn).should('be.enabled').click()
}

export function clickOnAddAccountManuallyBtn() {
  cy.get(addSpaceAccountManuallyBtn).should('be.enabled').click()
}

export function clickOnAddAccountManuallyModalBtn() {
  cy.get(addSpaceAccountManuallyModalBtn).should('be.visible').click()
}

export function selectNetwork(network) {
  cy.get(netwrokSelector).click()
  cy.get(netwrokItem).contains(network).click()
}

export function setAddress(address) {
  cy.get(addAddressInput).find('input').clear().type(address)
  cy.get(addAddressInput).find('input').should('have.value', address)
}

export function accountIsOndashboard(address) {
  const shortAddress = main.shortenAddress(address)
  cy.get(dashboardSafeList).contains(shortAddress).should('be.visible')
}

export function addAccountManually(address, network) {
  const shortAddress = main.shortenAddress(address)
  clickOnAddAccountBtn()
  clickOnAddAccountManuallyModalBtn()
  selectNetwork(network)
  setAddress(address)
  clickOnAddAccountManuallyBtn()
  clickOnAddAccountsBtn()
  accountIsOndashboard(address)
}

export function clickOnAddMemberBtn() {
  cy.get(addMemberBtn).should('be.enabled').click()
}

export function clickOnAddMemberModalBtn() {
  cy.get(addMemberModalBtn).should('be.enabled').click()
}

export function typeMemberAddress(address) {
  cy.get(memberAddressInput).find('input').clear().type(address)
}

export function typeMemberName(name) {
  cy.get(memberNameInput).find('input').clear().type(name)
}

export function memberIsInList(name) {
  cy.contains(name).should('be.visible')
}

export function addMember(name, address) {
  clickOnAddMemberBtn()
  typeMemberAddress(address)
  typeMemberName(name)
  clickOnAddMemberModalBtn()
  memberIsInList(name)
}

// ===========================================
// Onboarding selectors & labels
// ===========================================

export const selectSafesSkipBtn = '[data-testid="select-safes-skip-button"]'
export const selectSafesContinueBtn = '[data-testid="select-safes-continue-button"]'
export const inviteMembersSkipBtn = '[data-testid="invite-members-skip-button"]'
export const inviteMembersContinueBtn = '[data-testid="invite-members-continue-button"]'
export const createSpaceLabel = 'Create a space'
export const selectSafesLabel = 'Select Safes for your Space'
export const inviteTeamMembersLabel = 'Invite team members'

// Onboarding route paths
const onboardingCreateSpacePath = '/welcome/create-space'
const onboardingSelectSafesPath = '/welcome/select-safes'
const onboardingInviteMembersPath = '/welcome/invite-members'

// ===========================================
// Onboarding helpers
// ===========================================

export function createSpaceViaOnboardingWithSkip(name) {
  cy.get('body').then(($body) => {
    if (!$body.text().includes(createSpaceLabel)) {
      clickOnCreateSpaceBtn()
    }
  })
  // Step 1: Create a space — name and submit
  cy.url().should('include', onboardingCreateSpacePath)
  cy.contains(createSpaceLabel).should('be.visible')
  typeSpaceName(name)
  clickOnCreateSpaceBtn()

  // Step 2: Select Safes — wait for API to create space and navigate
  cy.url({ timeout: 30000 }).should('include', onboardingSelectSafesPath)
  cy.url().should('include', 'spaceId=')
  cy.get(selectSafesSkipBtn).should('be.visible').click()

  // Step 3: Invite Members — wait for navigation
  cy.url().should('include', onboardingInviteMembersPath)
  cy.url().should('include', 'spaceId=')
  cy.get(inviteMembersSkipBtn).should('be.visible').click()

  // Wait for space dashboard to fully load
  cy.url().should('include', constants.spaceDashboardUrl)
  cy.url().should('include', 'spaceId=')
}
