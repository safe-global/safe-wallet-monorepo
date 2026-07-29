import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import * as navigation from './navigation.page.js'

// ===========================================
// Selectors
// ===========================================

// -- Auth & welcome --
const orgList = '[data-testid="org-list"]'
export const createSpaceBtn = '[data-testid="create-space-button"]'
const sidebarLogo = '[data-testid="logo-container"]'
const classicViewLink = '[data-testid="classic-view-link"]'

// -- Space selector --
const spaceSelectorBtn = '[data-testid="space-selector-button"]'
const spaceSelectorMenu = '[data-testid="space-selector-menu"]'

// -- Space settings --
const spaceSettingsGeneralPage = '[data-testid="settings-general-page"]'
const spaceEditInput = '[data-testid="space-name-input"]'
const spaceSaveBtn = '[data-testid="space-save-button"]'
const spaceDeleteBtn = '[data-testid="space-delete-button"]'
const spaceConfirmDeleteBtn = '[data-testid="space-confirm-delete-button"]'
const spaceConfirmNameInput = '[data-testid="space-confirm-name-input"]'
// The welcome "Workspaces" list renders one SpaceRow per space (reworked from the old SpaceCard).
const spaceCard = '[data-testid="space-row"]'
const spaceCardName = '[data-testid="org-name"]'
const spaceCardContextMenuBtn = '[data-testid="space-card-context-menu-button"]'
const contectMenuRemoveBtn = '[data-testid="remove-button"]'

// -- Dashboard widgets --
const spaceDashboardAccountsWidget = '[data-testid="space-dashboard-accounts-widget"]'
// The Accounts widget reuses the shared SafeAccountsTable, so rows carry the same testids as the
// trusted/welcome account tables: one `account-table-row` per line (data-variant single|group|child).
const spaceDashboardAccountsRowSelector = '[data-testid="account-table-row"]'
const spaceDashboardTotalValue = '[data-testid="space-dashboard-total-value"]'
const pendingTxWidget = '[data-testid="space-dashboard-pending-widget"]'
const widgetItem = '[data-slot="widget-item"]'
export const dashboardSafeList = '[data-testid="dashboard-safe-list"]'

// -- Shared account row (SafeAccountTableRow — used by every account table, incl. the dashboard widget) --
const accountRowLink = '[data-testid="account-row-link"]'
const accountName = '[data-testid="account-cell-name"]'
const accountAddress = '[data-testid="safe-item-address"]'
const accountChainLogos = '[data-testid="account-cell-networks"]'
const accountBalance = '[data-testid="account-cell-balance"]'
const accountThreshold = '[data-testid="account-threshold"]'
const subAccountRow = `${spaceDashboardAccountsRowSelector}[data-variant="child"]`

// -- Shared --
const chainIndicatorNetworkLogoImg = '[data-testid="chain-indicator-network-logo-img"]'

// -- Safe-level navigation panel --
const spaceChainSelector = '[data-testid="space-chain-selector"]'
const safeSelectorTriggerIdenticon = '[data-testid="safe-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerAddress = '[data-testid="safe-selector-trigger-address"]'
const safeSelectorBalance = '[data-testid="safe-selector-balance"]'
// The header threshold is the shared ThresholdBadge (account-threshold), no longer a dedicated
// safe-selector-threshold testid.
const safeSelectorThreshold = '[data-testid="account-threshold"]'
const safeLevelNavigation = '[data-testid="safe-level-navigation"]'
const spaceSafesNavigationBlock = '[data-testid="space-safes-navigation-block"]'
const spaceChainNavigationButton = '[data-testid="space-chain-navigation-button"]'

// Back-to-space control now lives in the sidebar, not the safe-level navigation panel
export const backToSpaceBtn = '[data-testid="back-to-space-button"]'

// -- Space sidebar items --
export const sidebarItemDashboard = '[data-testid="sidebar-item-dashboard"]'
export const sidebarItemAccounts = '[data-testid="sidebar-item-safe-accounts"]'
export const sidebarItemAddressBook = '[data-testid="sidebar-item-address-book"]'
export const sidebarItemTeam = '[data-testid="sidebar-item-team"]'
export const sidebarItemSettings = '[data-testid="sidebar-item-settings"]'

// -- Safe accounts page --
const safeAccountsPageTitle = 'Safe accounts'
// The Safe accounts page now renders the shared SafeAccountsTable; count only top-level rows
// (multichain children render only when a group is expanded).
const safeAccountsTableRow = '[data-testid="account-table-row"]:not([data-variant="child"])'

// -- Add account --
const openAddAccountsChooserBtn = '[data-testid="open-add-accounts-chooser-button"]'
const addSpaceAccountToWorkspaceBtn = '[data-testid="add-safe-accounts-to-workspace-button"]'
const addSpaceAccountManuallyBtn = '[data-testid="add-space-account-manually-button"]'
const addSpaceAccountManuallyModalBtn = '[data-testid="add-manually-button"]'
const addAccountsBtn = '[data-testid="add-accounts-button"]'
const addAddressInput = '[data-testid="add-address-input"]'
const netwrokSelector = '[data-testid="network-selector"]'
const netwrokItem = '[data-testid="network-item"]'

// -- Add member --
const addMemberBtn = '[data-testid="add-member-button"]'
const addMemberModalBtn = '[data-testid="add-member-modal-button"]'
const memberAddressInput = '[data-testid="member-invitee-identifier-input"]'
const memberNameInput = '[data-testid="member-name-input"]'
const pendingMembersTab = '[data-testid="pending-members-tab"]'

// -- Invites --
const inviteBanner = '[data-testid="space-invite-banner"]'
const inviteBannerHeadingText = 'You were invited to join'
const acceptInviteBtn = '[data-testid="accept-invite-button"]'
const inviteNameInput = '[data-testid="invite-name-input"]'
const confirmAcceptInviteBtn = '[data-testid="confirm-accept-invite-button"]'

// -- Header account menu (sign-out) --
const headerAccountMenuTrigger = '[data-testid="header-account-info"] button'
const sidebarProfilePopover = '[data-testid="sidebar-profile-popover"]'
const sidebarProfileSignOutBtn = '[data-testid="sidebar-profile-sign-out"]'
const continueWithWalletBtn = '[data-testid="continue-with-wallet-btn"]'
// The signed-out /welcome/spaces keeps the Topbar, which renders its own generic "Connect Wallet"
// button with the same data-testid as the sign-in card's button — so the card button is matched by
// its "Continue with wallet" text instead of by index.
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
const workspaceWalletBtnText = 'Continue with wallet'
const onboardV2 = 'onboard-v2'
const pkInput = '[data-testid="private-key-input"]'
const pkConnectBtn = '[data-testid="pk-connect-btn"]'

// -- Onboarding --
const orgSpaceInput = '[data-testid="space-name-input"]'
const createSpaceOnboardingContinueBtn = '[data-testid="create-space-onboarding-continue-button"]'
const selectSafesSkipLink = '[data-testid="select-safes-skip-link"]'
const inviteMembersSkipBtn = '[data-testid="invite-members-skip-button"]'
const surveyOptionCard = '[data-testid="survey-option-card"]'
const surveyFinishBtn = '[data-testid="survey-finish-button"]'
const onboardingCreateSpacePath = '/welcome/create-space'
const onboardingSelectSafesPath = '/welcome/select-safes'
const onboardingInviteMembersPath = '/welcome/invite-members'
const onboardingSurveyPath = '/welcome/survey'

// -- Empty dashboard --
export const gettingStartedLabel = 'Getting started'
export const addSafeAccountsLabel = 'Add your Safe accounts'
export const addAccountsModalLabel = 'Add Safe accounts'
export const importAddressBookBtn = '[aria-label="Import address book"]'
export const importAddressBookLabel = 'Import address book'
export const dashboardAddMemberBtn = '[data-testid="add-member-button"]'
export const inviteMemberLabel = 'Add member'
export const learnMoreBtn = '[data-testid="spaces-learn-more-button"]'
export const exploreSpacesLabel = 'Introducing workspaces'

// ===========================================
// Labels & regex patterns
// ===========================================

const spaceDashboardTotalValueLabelText = 'Total value'
// Both the Accounts and Pending widgets render a "View all" button with this testid, so scope it to
// the Accounts widget container when clicking.
const widgetViewAllBtn = '[data-testid="widget-view-all"]'
const updateSuccessMsg = 'Workspace name updated'
const formattedSpaceTotalValuePattern = /^\$[\u200a\s]*[\d,]+\.\d{2}$/

export const nonZeroBalanceRegex = /\$[\u200a\s]*[1-9][\d,]*(?:\.\d{2})?/
export const zeroBalanceRegex = /\$[\u200a\s]*0(?:\.00)?/
export const txDetailsLabel = 'Transaction details'
export const pendingTxName = 'Send'
export const pendingTxStatus = 'Needs confirmation'
export const deleteSpaceConfirmationMsg = (name) => `Deleted workspace ${name}`
export const acceptInviteConfirmationMsg = (spaceName) => `Accepted invite to ${spaceName}`

// ===========================================
// Internal helpers (selectors builders)
// ===========================================

function getAccountItem(index) {
  return `${spaceDashboardAccountsWidget} ${spaceDashboardAccountsRowSelector}:eq(${index})`
}

// A single-chain (non-group) account row navigates via its name link.
const singleChainAccountRow = `${spaceDashboardAccountsWidget} ${spaceDashboardAccountsRowSelector}[data-variant="single"] ${accountRowLink}`

// Multi-chain groups expand inline: their per-chain safes render as sibling `child` rows in the same
// table body, so the "expanded panel" is just the widget scoped to those child rows.
function getAccountExpandedPanel() {
  return spaceDashboardAccountsWidget
}

export function getPendingTxItem(index) {
  return `${pendingTxWidget} ${widgetItem}:eq(${index})`
}

const spaceDashboardWidgetSelectorByTitle = {
  Accounts: spaceDashboardAccountsWidget,
  Pending: pendingTxWidget,
}

// ===========================================
// Auth & navigation actions
// ===========================================

export function clickOnSignInBtn() {
  cy.get(continueWithWalletBtn).click()
}

// Full workspace sign-in from the signed-out /welcome/spaces card. Clicking the card's "Continue
// with wallet" button opens onboard; after injecting the signer the card flips to a "Continue with
// <wallet>" button that runs SIWE, which finishes signing into the workspace.
export function signInWithWallet(signer) {
  cy.contains(connectWalletBtn, workspaceWalletBtnText, { timeout: 30000 }).should('be.visible').click()
  cy.get(onboardV2, { timeout: 30000 }).shadow().find('button').contains('Private key').click()
  cy.get(pkInput, { timeout: 30000 })
    .find('input')
    .then(($input) => {
      $input.val(signer)
      cy.wrap($input).trigger('input').trigger('change')
    })
  cy.get(pkConnectBtn).click()
  // The page renders more than one sign-in card (the workspace card plus the generic "Sign in to
  // see content" gate), each with a continue-with-wallet-btn — click the visible one.
  cy.get(continueWithWalletBtn, { timeout: 30000 }).filter(':visible').first().click()
}

export function clickOnUseOldUiBtn() {
  cy.get(classicViewLink, { timeout: 30000 }).should('be.visible').click()
}

// Seeds the same sessionStorage opt-in that "Use the old UI" sets, so the
// /welcome/spaces sign-in gate is bypassed without clicking through it. Pass to
// cy.visit as onBeforeLoad so the flag is present before the app boots, and
// re-seed on every visit — sessionStorage is per-visit in the test runner.
export function bypassSpacesLogin(win) {
  win.sessionStorage.setItem(constants.sessionStorageKeys.SAFE_v2__classicViewEnabled, JSON.stringify(true))
}

export function visitClassicView(url) {
  cy.visit(url, { onBeforeLoad: bypassSpacesLogin })
}

export function blockBeamer() {
  // Block the Beamer widget script so its announcement popup never renders and
  // covers onboarding buttons. Call before cy.visit().
  cy.intercept('GET', 'https://*.getbeamer.com/**', { statusCode: 204, body: '' })
}

export function interceptSpacesList() {
  // Alias the spaces list request so we can wait for it to resolve before deciding
  // whether the account has spaces. Register before cy.visit().
  cy.intercept('GET', constants.spacesEndpoint).as('spacesList')
}

export function signOutViaAccountMenu() {
  cy.get(headerAccountMenuTrigger, { timeout: 30000 }).should('be.visible').click()
  cy.get(sidebarProfilePopover).should('be.visible')
  cy.get(sidebarProfileSignOutBtn).should('be.visible').click()
  cy.url({ timeout: 60000 }).should('include', constants.spacesUrl)
  cy.get(continueWithWalletBtn, { timeout: 30000 }).should('be.visible')
}

export function verifyOnSingleSpaceDashboard(spaceName) {
  cy.url({ timeout: 60000 })
    .should('include', constants.spaceDashboardUrl)
    .and('include', 'spaceId=')
    .and('not.include', onboardingCreateSpacePath)
  cy.get(spaceSelectorBtn, { timeout: 30000 }).should('be.visible').and('contain.text', spaceName)
}

export function waitForSpacesWelcomeReady() {
  cy.get(`${orgList}, ${createSpaceBtn}`, { timeout: 60000 }).filter(':visible').should('have.length.at.least', 1)
}

export function visitSpaceDashboard(spaceId) {
  cy.visit(constants.spaceDashboardUrl + String(spaceId))
}

export function goToSpacesView() {
  // When the account has a single space, sign-in auto-redirects into the space
  // dashboard where the Create button is absent — click the top-left logo to
  // return to the Spaces View. Wait for the spaces list to resolve first so the
  // welcome page has rendered before we read whether the Create button exists;
  // otherwise we misread the in-flight page as a space dashboard.
  cy.wait('@spacesList', { timeout: 60000 })
  cy.url({ timeout: 30000 }).then((url) => {
    if (url.includes(constants.spaceDashboardUrl)) {
      cy.get(sidebarLogo).should('be.visible').click()
      cy.url().should('include', constants.spacesUrl)
    }
  })
  cy.get(`${orgList}, ${createSpaceBtn}`, { timeout: 30000 }).filter(':visible').should('have.length.at.least', 1)
}

export function openSpaceByName(name) {
  // From the Spaces View list, open the space whose row carries this name (call goToSpacesView first
  // if a single-space account may have auto-redirected into a dashboard).
  cy.contains(spaceCard, name, { timeout: 30000 }).should('be.visible').click()
  cy.url({ timeout: 30000 }).should('include', constants.spaceDashboardUrl).and('include', 'spaceId=')
}

export function clickOnSpaceSelector(spaceName) {
  cy.get(spaceSelectorBtn, { timeout: 15000 }).should('be.visible').click()
  if (spaceName) {
    cy.get(spaceSelectorMenu).contains(spaceName).click()
  }
}

export function disconnectFromSpaceLevel() {
  navigation.clickOnExpandWalletBtn()
  navigation.clickOnDisconnectBtn()
}

// Navigate to a space section through the sidebar (client-side) rather than a full cy.visit reload.
// Dismiss any open popover first (e.g. the space selector left open by clickOnSpaceSelector) so it
// can't cover the nav item.
function openSpaceSection(sidebarSelector, pathFragment) {
  cy.get('body').type('{esc}')
  cy.get(sidebarSelector, { timeout: 30000 }).should('be.visible').click()
  cy.url({ timeout: 30000 }).should('include', pathFragment).and('include', 'spaceId=')
}

export function goToSpaceSettings() {
  openSpaceSection(sidebarItemSettings, '/spaces/settings')
}

export function goToSpaceMembers() {
  openSpaceSection(sidebarItemTeam, '/spaces/members')
}

export function goToSpaceSafeAccounts() {
  openSpaceSection(sidebarItemAccounts, '/spaces/safe-accounts')
}

// ===========================================
// Dashboard actions
// ===========================================

export function clickAccountItemByIndex(index) {
  cy.get(getAccountItem(index)).click()
}

export function clickSingleChainAccountRow() {
  cy.get(singleChainAccountRow).first().should('be.visible').click()
}

export function clickExpandedPanelSubAccountRow(rowIndex, subRowIndex) {
  cy.get(getAccountExpandedPanel(rowIndex)).find(subAccountRow).eq(subRowIndex).click()
}

export function clickViewAllAccounts() {
  cy.get(spaceDashboardAccountsWidget).find(widgetViewAllBtn).should('be.visible').click()
}

export function verifySidebarItemNavigates(sidebarSelector, pathFragment) {
  cy.get(sidebarSelector).should('be.visible').click()
  cy.url().should('include', pathFragment).and('include', 'spaceId=')
}

// ===========================================
// Dashboard verify functions
// ===========================================

export function verifySpaceDashboardTotalValueFormat() {
  main.verifyTextVisibility([spaceDashboardTotalValueLabelText])
  cy.get(spaceDashboardTotalValue, { timeout: 30000 })
    .should('be.visible')
    .invoke('text')
    .should('match', formattedSpaceTotalValuePattern)
}

export function verifySpaceDashboardWidgetVisible(widgetTitle) {
  const selector = spaceDashboardWidgetSelectorByTitle[widgetTitle]
  if (!selector) {
    throw new Error(`Unknown space dashboard widget title: ${widgetTitle}`)
  }
  cy.get(selector, { timeout: 30000 }).should('be.visible')
}

export function verifySpaceDashboardAccountsWidgetRowCount(expectedCount) {
  main.verifyElementsCount(`${spaceDashboardAccountsWidget} ${spaceDashboardAccountsRowSelector}`, expectedCount)
}

export function verifyPendingTxWidgetItemCount(expectedCount) {
  main.verifyElementsCount(`${pendingTxWidget} ${widgetItem}`, expectedCount)
}

// Single- and multi-chain rows now render through the same shared component, so `type` is kept only
// for call-site readability — both resolve to the same row/cell testids.
export function verifyAccountRowDetails(
  type,
  rowIndex,
  { name, address, balanceRegex, ownersThreshold, chainLogosCount },
) {
  const row = getAccountItem(rowIndex)
  cy.get(row)
    .should('be.visible')
    .within(() => {
      cy.get(accountName).should('be.visible').and('contain.text', name)
      // FullAddress renders the whole address in the DOM (the middle is only clipped visually).
      cy.get(accountAddress).should('be.visible').and('contain.text', address)
      if (chainLogosCount !== undefined) {
        cy.get(accountChainLogos).find(chainIndicatorNetworkLogoImg).should('have.length', chainLogosCount)
      } else {
        cy.get(accountChainLogos).find(chainIndicatorNetworkLogoImg).should('be.visible')
      }
      if (balanceRegex !== undefined) {
        cy.get(accountBalance).invoke('text').should('match', balanceRegex)
      }
      if (ownersThreshold !== undefined) {
        cy.get(accountThreshold).should('be.visible').and('contain.text', ownersThreshold)
      }
    })
}

export function verifyExpandedPanelSubAccountRowsCount(expectedCount) {
  cy.get(getAccountExpandedPanel()).find(subAccountRow).should('have.length', expectedCount)
}

export function verifyAccountExpandedPanelVisible() {
  cy.get(getAccountExpandedPanel()).should('be.visible')
}

// ===========================================
// Safe-level navigation verify functions
// ===========================================

function verifySafeDashboardUrlSafeQuery(expectedSafeParam) {
  cy.url({ timeout: 30000 }).should('include', '/home')
  cy.url().should((href) => {
    expect(new URL(href).searchParams.get('safe'), 'safe query param').to.eq(expectedSafeParam)
  })
}

function verifySafeSelectorNavigationPanel({ expectedName, fullAddress, balanceRegex, ownersThreshold }) {
  // The header renders the full, unprefixed address via <FullAddress> on sm+ viewports (the test
  // viewport is 1280px), no longer a shortened form.
  const expectedLine = fullAddress
  cy.get(safeSelectorTriggerIdenticon, { timeout: 30000 }).should('be.visible')
  cy.get(safeSelectorTriggerName, { timeout: 30000 }).should('be.visible').and('contain.text', expectedName)
  cy.get(safeSelectorTriggerAddress).should('be.visible').and('contain.text', expectedLine)
  if (balanceRegex !== undefined) {
    cy.get(safeSelectorBalance).should('be.visible').invoke('text').should('match', balanceRegex)
  }
  if (ownersThreshold !== undefined) {
    cy.get(safeSelectorThreshold).should('be.visible').and('contain.text', ownersThreshold)
  }
  cy.get(spaceChainSelector, { timeout: 30000 })
    .should('be.visible')
    .find(chainIndicatorNetworkLogoImg)
    .should('be.visible')
}

export function verifyOpenedSafeDashboardFromSpaceAccountsRow({
  safeFullQuery,
  expectedName,
  fullAddress,
  chainShortName,
  balanceRegex,
  ownersThreshold,
}) {
  verifySafeDashboardUrlSafeQuery(safeFullQuery)
  verifySafeSelectorNavigationPanel({ expectedName, fullAddress, chainShortName, balanceRegex, ownersThreshold })
}

export function verifySafeUrlIncludesParam(safeQueryIncludes) {
  cy.url().should('include', '/home').and('include', 'safe=').and('include', safeQueryIncludes)
}

export function verifyUrlIncludesPath(path) {
  cy.url().should('include', path)
}

// ===========================================
// Sidebar verify functions
// ===========================================

export function verifySpaceSidebarItemsVisible() {
  cy.get(sidebarItemAccounts).should('be.visible')
  cy.get(sidebarItemTeam).should('be.visible')
}

export function verifySpaceSidebarItemsNotVisible() {
  cy.get(sidebarItemAccounts).should('not.exist')
  cy.get(sidebarItemTeam).should('not.exist')
}

export function verifySafeLevelNavigationElements() {
  cy.get(safeLevelNavigation).find(spaceSafesNavigationBlock).should('be.visible')
  cy.get(safeLevelNavigation).find(spaceChainNavigationButton).should('be.visible')
}

export function verifyBackToSpaceButtonVisible() {
  cy.get(backToSpaceBtn).should('be.visible')
}

export function clickBackToSpaceButton() {
  cy.get(backToSpaceBtn).should('be.visible').click()
}

// ===========================================
// Safe accounts page verify functions
// ===========================================

export function verifyViewAllAccountsPageOpened(expectedAccountsCount) {
  cy.url().should('include', '/spaces/safe-accounts').and('include', 'spaceId=')
  cy.contains(safeAccountsPageTitle, { timeout: 30000 }).should('be.visible')
  if (expectedAccountsCount !== undefined) {
    main.verifyElementsCount(safeAccountsTableRow, expectedAccountsCount)
  }
}

// ===========================================
// Space selector verify functions
// ===========================================

export function spaceExists(name) {
  cy.get(spaceSelectorMenu).contains(name).should('be.visible')
}

export function verifySpaceSelectorMenuVisible() {
  cy.get(spaceSelectorMenu).should('be.visible')
}

export function verifySpaceSelectorContainsSpaces(names) {
  names.forEach((name) => {
    cy.get(spaceSelectorMenu).contains(name).should('be.visible')
  })
}

// ===========================================
// Space CRUD (basic flow)
// ===========================================

export function verifySpaceSettingsGeneralLoaded() {
  cy.url({ timeout: 30000 }).should('include', '/spaces/settings/general').and('include', 'spaceId=')
  cy.get(spaceSettingsGeneralPage, { timeout: 30000 }).should('be.visible')
}

export function editSpace(newName) {
  cy.get(spaceEditInput).should('be.visible').and('be.enabled').clear().type(newName)
  cy.get(spaceSaveBtn).should('be.enabled').click()
  cy.contains(updateSuccessMsg).should('be.visible')
}

export function deleteSpace(name) {
  cy.get(spaceDeleteBtn).click({ force: true })
  cy.get(spaceConfirmNameInput).type(name)
  cy.get(spaceConfirmDeleteBtn).should('be.enabled').click()
  cy.contains(spaceCard, name).should('not.exist')
}

const MAX_SPACES = 10

function deleteOneSpace() {
  cy.get(spaceCard).then(($cards) => {
    const firstCardName = $cards.first().find(spaceCardName).text().trim()
    cy.wrap($cards.first()).within(() => {
      cy.get(spaceCardContextMenuBtn).click({ force: true })
    })
    cy.get(contectMenuRemoveBtn).click({ force: true })
    cy.get(spaceConfirmNameInput).type(firstCardName)
    cy.get(spaceConfirmDeleteBtn).should('be.enabled').click()
    cy.get(spaceCard, { timeout: 10000 }).should('have.length.lessThan', MAX_SPACES)
  })
}

export function ensureReadyToCreateSpace() {
  // Wait for the page to settle: either the spaces list or the create button must be visible
  cy.get(`${orgList}, ${createSpaceBtn}`, { timeout: 30000 }).filter(':visible').should('have.length.at.least', 1)

  // The cards may render slightly after the list container, and at the limit the
  // Create button is disabled. Give the cards a beat to load, then read the count
  // and delete a space to free a slot before any create attempt.
  cy.wait(2000)
  cy.get('body').then(($body) => {
    if ($body.find(spaceCard).length >= MAX_SPACES) {
      deleteOneSpace()
    }
  })

  // Wait for either the create button or the create-space form to settle after deletion/redirect
  cy.get(`${createSpaceBtn}, ${orgSpaceInput}`, { timeout: 30000 }).filter(':visible').should('have.length.at.least', 1)
}

// ===========================================
// Add account flow
// ===========================================

export function selectNetwork(network) {
  cy.get(netwrokSelector).click()
  cy.get(netwrokItem).contains(network).click()
}

export function openAddAccountsToWorkspace() {
  cy.get(openAddAccountsChooserBtn, { timeout: 30000 }).should('be.visible').and('be.enabled').click({ force: true })
  cy.contains('[role="dialog"]', 'Add Safe accounts', { timeout: 30000 })
    .should('be.visible')
    .within(() => {
      cy.get(addSpaceAccountToWorkspaceBtn, { timeout: 30000 }).should('be.visible')
      cy.get(addSpaceAccountToWorkspaceBtn).should('not.have.attr', 'aria-disabled')
      cy.get(addSpaceAccountToWorkspaceBtn).click({ force: true })
    })
}

export function addAccountManually(address, network) {
  openAddAccountsToWorkspace()
  cy.get(addSpaceAccountManuallyModalBtn).should('be.visible').click()
  selectNetwork(network)
  cy.get(addAddressInput).find('input').clear().type(address)
  cy.get(addAddressInput).find('input').should('have.value', address)
  cy.get(addSpaceAccountManuallyBtn).should('be.enabled').click()
  cy.get(addAccountsBtn).should('be.enabled').click()
  // Added accounts land in the Safe accounts table; FullAddress keeps the whole address in the DOM.
  cy.contains(accountAddress, address, { timeout: 30000 }).should('be.visible')
}

// ===========================================
// Add member & invite flow
// ===========================================

export function addMember(name, address) {
  cy.get(addMemberBtn, { timeout: 30000 }).should('be.enabled').click()
  cy.get(memberAddressInput).clear().type(address)
  cy.get(memberNameInput).find('input').clear().type(name)
  cy.get(addMemberModalBtn).should('be.enabled').click()

  cy.get(pendingMembersTab).should('be.visible').click()
  cy.contains(name).should('be.visible')
}

export function verifySpaceInviteBannerVisible(spaceName) {
  cy.get(inviteBanner, { timeout: 30000 })
    .contains(spaceName)
    .parents(inviteBanner)
    .should('be.visible')
    .within(() => {
      cy.contains(inviteBannerHeadingText).should('be.visible')
      cy.contains(spaceName).should('be.visible')
    })
}

export function acceptInvite(spaceName, name) {
  // Scope to this run's invite: the member may hold several pending invites, so click Accept inside
  // the banner for the space under test rather than the first accept-invite-button on the page.
  cy.contains(inviteBanner, spaceName).find(acceptInviteBtn).click()
  cy.get(inviteNameInput).find('input').clear().type(name)
  cy.get(confirmAcceptInviteBtn).click()
  // Accepting navigates into the joined workspace; the caller verifies the success message.
}

// ===========================================
// Onboarding flow
// ===========================================

function navigateToCreateSpacePage() {
  // Wait for the page to settle, then check if we need to click "Create space" or are already on the form
  cy.url({ timeout: 15000 }).then((url) => {
    if (url.includes(onboardingCreateSpacePath)) {
      // Already redirected to create-space form
      cy.get(orgSpaceInput).should('be.visible')
    } else {
      // Still on spaces list — wait a moment for potential auto-redirect
      cy.wait(3000)
      cy.url().then((urlAfterWait) => {
        if (!urlAfterWait.includes(onboardingCreateSpacePath)) {
          cy.get(createSpaceBtn).should('be.visible').click()
        }
      })
    }
  })
  cy.url().should('include', onboardingCreateSpacePath)
  cy.get(orgSpaceInput).should('be.visible')
}

function submitSpaceName(name) {
  cy.get(orgSpaceInput).should('be.visible').and('be.enabled').clear().type(name)
  cy.get(createSpaceOnboardingContinueBtn).should('be.enabled').click()
}

function skipSelectSafesStep() {
  cy.url({ timeout: 30000 }).should('include', onboardingSelectSafesPath).and('include', 'spaceId=')
  // Click the on-page skip link (client-side router.push to invite-members) instead of a full
  // cy.visit reload: the reload reboots the app and pays the per-navigation long task, so the
  // invite-members skip button renders after the command times out.
  cy.get(selectSafesSkipLink).should('be.visible').click()
  cy.url({ timeout: 30000 }).should('include', onboardingInviteMembersPath).and('include', 'spaceId=')
}

function skipInviteMembersStep() {
  cy.url().should('include', onboardingInviteMembersPath).and('include', 'spaceId=')
  cy.get(inviteMembersSkipBtn).should('be.visible').click()
}

function completeSurveyStep() {
  cy.get(`${surveyOptionCard}, ${dashboardSafeList}`, { timeout: 30000 }).filter(':visible').should('exist')
  cy.url().then((url) => {
    if (!url.includes(onboardingSurveyPath)) return
    cy.get(surveyOptionCard, { timeout: 30000 }).filter(':visible').first().click()
    cy.get(surveyFinishBtn).should('be.enabled').click()
  })
}

function verifySpaceDashboardLoaded() {
  cy.url({ timeout: 30000 }).should('include', constants.spaceDashboardUrl).and('include', 'spaceId=')
}

export function createSpaceViaOnboardingWithSkip(name) {
  navigateToCreateSpacePage()
  submitSpaceName(name)
  skipSelectSafesStep()
  skipInviteMembersStep()
  completeSurveyStep()
  verifySpaceDashboardLoaded()
}
