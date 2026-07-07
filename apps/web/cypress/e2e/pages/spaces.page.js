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
const spaceCard = '[data-testid="space-card"]'
const spaceCardName = '[data-testid="org-name"]'
const spaceCardContextMenuBtn = '[data-testid="space-card-context-menu-button"]'
const contectMenuRemoveBtn = '[data-testid="remove-button"]'

// -- Dashboard widgets --
const spaceDashboardAccountsWidget = '[data-testid="space-dashboard-accounts-widget"]'
const spaceDashboardAccountsRowSelector = '[data-testid^="space-dashboard-accounts-row-"]'
const spaceDashboardTotalValue = '[data-testid="space-dashboard-total-value"]'
const pendingTxWidget = '[data-testid="space-dashboard-pending-widget"]'
const widgetItem = '[data-slot="widget-item"]'
export const dashboardSafeList = '[data-testid="dashboard-safe-list"]'

// -- Single-chain account row (AccountWidgetItem) --
const singleAccountName = '[data-testid="single-account-name"]'
const singleAccountAddress = '[data-testid="single-account-address"]'
const singleAccountIdenticon = '[data-testid="single-account-identicon"]'
const singleAccountChainLogos = '[data-testid="single-account-chain-logos"]'
const singleAccountBalance = '[data-testid="single-account-balance"]'
const singleAccountThreshold = '[data-testid="single-account-threshold"]'

// -- Multichain account row (ExpandableAccountItem / AccountItemContent) --
const multichainAccountName = '[data-testid="multichain-account-name"]'
const multichainAccountAddress = '[data-testid="multichain-account-address"]'
const multichainAccountIdenticon = '[data-testid="multichain-account-identicon"]'
const multichainAccountChainLogos = '[data-testid="multichain-account-chain-logos"]'
const subAccountRow = '[data-testid="sub-account-row"]'

// -- Shared --
const chainIndicatorNetworkLogoImg = '[data-testid="chain-indicator-network-logo-img"]'

// -- Safe-level navigation panel --
const spaceChainSelector = '[data-testid="space-chain-selector"]'
const safeSelectorTriggerIdenticon = '[data-testid="safe-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerAddress = '[data-testid="safe-selector-trigger-address"]'
const safeSelectorBalance = '[data-testid="safe-selector-balance"]'
const safeSelectorThreshold = '[data-testid="safe-selector-threshold"]'
const safeLevelNavigation = '[data-testid="safe-level-navigation"]'
const spaceSafesNavigationBlock = '[data-testid="space-safes-navigation-block"]'
const spaceChainNavigationButton = '[data-testid="space-chain-navigation-button"]'

// Back-to-space control now lives in the sidebar, not the safe-level navigation panel
export const backToSpaceBtn = '[data-testid="back-to-space-button"]'

// -- Space sidebar items --
export const sidebarItemHome = '[data-testid="sidebar-item-home"]'
export const sidebarItemAccounts = '[data-testid="sidebar-item-safe-accounts"]'
export const sidebarItemAddressBook = '[data-testid="sidebar-item-address-book"]'
export const sidebarItemTeam = '[data-testid="sidebar-item-team"]'
export const sidebarItemSettings = '[data-testid="sidebar-item-settings"]'

// -- Safe accounts page --
const safeAccountsPageTitle = 'Safe accounts'
const safeAccountsListItem = '[data-testid="safe-list-item"]'

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

// -- Sidebar profile (sign-out) --
const sidebarProfileTrigger = '[data-testid="sidebar-profile-trigger"]'
const sidebarProfilePopover = '[data-testid="sidebar-profile-popover"]'
const sidebarProfileSignOutBtn = '[data-testid="sidebar-profile-sign-out"]'
const continueWithWalletBtn = '[data-testid="continue-with-wallet-btn"]'

// -- Onboarding --
const orgSpaceInput = '[data-testid="space-name-input"]'
const createSpaceOnboardingContinueBtn = '[data-testid="create-space-onboarding-continue-button"]'
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
const viewAllAccountsLabel = 'View all accounts'
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
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-row-${index}"]`
}

const singleChainAccountRow = `${spaceDashboardAccountsWidget} [data-testid^="space-dashboard-accounts-row-"]:has(${singleAccountName})`

function getAccountExpandedPanel(rowIndex) {
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-expanded-${rowIndex}"]`
}

export function getPendingTxItem(index) {
  return `${pendingTxWidget} ${widgetItem}:eq(${index})`
}

function getSpaceId() {
  return cy.url().then((url) => {
    const match = url.match(/spaceId=([^&]+)/)
    if (!match) {
      throw new Error('spaceId not found in the URL')
    }
    return match[1]
  })
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

export function signOutViaSidebarProfile() {
  cy.get(sidebarProfileTrigger, { timeout: 30000 }).should('be.visible').click()
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
  cy.contains(viewAllAccountsLabel).click()
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

const accountRowSelectors = {
  single: {
    identicon: singleAccountIdenticon,
    name: singleAccountName,
    address: singleAccountAddress,
    chainLogos: singleAccountChainLogos,
    balance: singleAccountBalance,
    threshold: singleAccountThreshold,
  },
  multichain: {
    identicon: multichainAccountIdenticon,
    name: multichainAccountName,
    address: multichainAccountAddress,
    chainLogos: multichainAccountChainLogos,
  },
}

export function verifyAccountRowDetails(
  type,
  rowIndex,
  { name, address, balanceRegex, ownersThreshold, chainLogosCount },
) {
  const sel = accountRowSelectors[type]
  const row = getAccountItem(rowIndex)
  cy.get(row)
    .should('be.visible')
    .within(() => {
      cy.get(sel.identicon).should('be.visible')
      cy.get(sel.name).should('be.visible').and('contain.text', name)
      cy.get(sel.address).should('be.visible').and('contain.text', main.shortenAddress(address))
      if (sel.chainLogos) {
        cy.get(sel.chainLogos).find(chainIndicatorNetworkLogoImg).should('be.visible')
      }
      if (balanceRegex !== undefined && sel.balance) {
        cy.get(sel.balance).invoke('text').should('match', balanceRegex)
      }
      if (ownersThreshold !== undefined && sel.threshold) {
        cy.get(sel.threshold).should('be.visible').and('contain.text', ownersThreshold)
      }
      if (chainLogosCount !== undefined && sel.chainLogos) {
        cy.get(sel.chainLogos).find(chainIndicatorNetworkLogoImg).should('have.length', chainLogosCount)
      }
    })
}

export function verifyExpandedPanelSubAccountRowsCount(rowIndex, expectedCount) {
  cy.get(getAccountExpandedPanel(rowIndex)).find(subAccountRow).should('have.length', expectedCount)
}

export function verifyAccountExpandedPanelVisible(rowIndex) {
  cy.get(getAccountExpandedPanel(rowIndex)).should('be.visible')
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
  // The selector no longer shows the chain prefix; assert the (unprefixed) shortened address only.
  const expectedLine = main.shortenAddress(fullAddress)
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
    main.verifyElementsCount(safeAccountsListItem, expectedAccountsCount)
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
  cy.get(dashboardSafeList).contains(main.shortenAddress(address)).should('be.visible')
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

export function acceptInvite(name) {
  cy.get(acceptInviteBtn).click()
  cy.get(inviteNameInput).find('input').clear().type(name)
  cy.get(confirmAcceptInviteBtn).click()
  cy.contains(name).should('be.visible')
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
  cy.url().then((url) => {
    const match = url.match(/spaceId=([^&]+)/)
    if (!match) throw new Error('spaceId not found in URL')
    const spaceId = match[1]
    cy.visit(`${onboardingInviteMembersPath}?spaceId=${spaceId}`)
  })
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

function openFirstExistingSpace() {
  cy.get(`${orgList} ${spaceCard}`, { timeout: 30000 }).first().should('be.visible').click()
  cy.url({ timeout: 30000 }).should('include', constants.spaceDashboardUrl).and('include', 'spaceId=')
}

export function openFirstSpaceFromSpacesView() {
  // After sign-in a single-space account auto-redirects into the space dashboard;
  // click the logo to return to the Spaces View so a space card is always present.
  cy.wait('@spacesList', { timeout: 60000 })
  cy.url({ timeout: 30000 }).then((url) => {
    if (url.includes(constants.spaceDashboardUrl)) {
      cy.get(sidebarLogo).should('be.visible').click()
      cy.url().should('include', constants.spacesUrl)
    }
  })
  cy.get(`${orgList} ${spaceCard}`, { timeout: 30000 }).should('have.length.at.least', 1)
  openFirstExistingSpace()
}
