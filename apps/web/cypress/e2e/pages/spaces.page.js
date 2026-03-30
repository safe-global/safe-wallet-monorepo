import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import * as navigation from './navigation.page.js'

// ===========================================
// Selectors
// ===========================================

// -- Auth & welcome --
const orgList = '[data-testid="org-list"]'
export const spacesListCreateSpaceBtn = '[data-testid="spaces-list-create-space-button"]'

// -- Space selector --
const spaceSelectorBtn = '[data-testid="space-selector-button"]'
const spaceSelectorMenu = '[data-testid="space-selector-menu"]'

// -- Space settings --
const spaceEditInput = 'input[name="name"]'
const spaceSaveBtn = '[data-testid="space-save-button"]'
const spaceDeleteBtn = '[data-testid="space-delete-button"]'
const spaceConfirmDeleteBtn = '[data-testid="space-confirm-delete-button"]'
const spaceCard = '[data-testid="space-card"]'
const spaceVertMenuIcon = '[data-testid="MoreVertIcon"]'
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
const safeSelectorTriggerIdenticon = '[data-testid="safe-selector-trigger-identicon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerAddress = '[data-testid="safe-selector-trigger-address"]'
const safeSelectorBalance = '[data-testid="safe-selector-balance"]'
const safeSelectorThreshold = '[data-testid="safe-selector-threshold"]'
const safeLevelNavigation = '[data-testid="safe-level-navigation"]'
const spaceSafesNavigationBlock = '[data-testid="space-safes-navigation-block"]'
const spaceChainNavigationButton = '[data-testid="space-chain-navigation-button"]'
const backToSpaceBtn = '[aria-label="Back to space"]'
const safeLevelNavigationBackToSpaceBtn = `${safeLevelNavigation} ${backToSpaceBtn}`

// -- Space sidebar items --
export const sidebarItemHome = '[data-testid="sidebar-item-home"]'
export const sidebarItemAccounts = '[data-testid="sidebar-item-accounts"]'
export const sidebarItemAddressBook = '[data-testid="sidebar-item-address-book"]'
export const sidebarItemTeam = '[data-testid="sidebar-item-team"]'
export const sidebarItemSettings = '[data-testid="sidebar-item-settings"]'

// -- Safe Accounts page --
const safeAccountsPageTitle = 'Safe Accounts'
const safeAccountsListItem = '[data-testid="safe-list-item"]'

// -- Add account --
const addSpaceAccountBtn = '[data-testid="add-space-account-button"]'
const addSpaceAccountManuallyBtn = '[data-testid="add-space-account-manually-button"]'
const addSpaceAccountManuallyModalBtn = '[data-testid="add-manually-button"]'
const addAccountsBtn = '[data-testid="add-accounts-button"]'
const addAddressInput = '[data-testid="add-address-input"]'
const netwrokSelector = '[data-testid="network-selector"]'
const netwrokItem = '[data-testid="network-item"]'

// -- Add member --
const addMemberBtn = '[data-testid="add-member-button"]'
const addMemberModalBtn = '[data-testid="add-member-modal-button"]'
const memberAddressInput = '[data-testid="member-address-input"]'
const memberNameInput = '[data-testid="member-name-input"]'

// -- Invites --
const acceptInviteBtn = '[data-testid="accept-invite-button"]'
const inviteNameInput = '[data-testid="invite-name-input"]'
const confirmAcceptInviteBtn = '[data-testid="confirm-accept-invite-button"]'

// -- Onboarding --
const orgSpaceInput = '[data-testid="space-name-input"]'
const createSpaceOnboardingContinueBtn = '[data-testid="create-space-onboarding-continue-button"]'
const selectSafesSkipBtn = '[data-testid="select-safes-skip-button"]'
const inviteMembersSkipBtn = '[data-testid="invite-members-skip-button"]'
const onboardingCreateSpacePath = '/welcome/create-space'
const onboardingSelectSafesPath = '/welcome/select-safes'
const onboardingInviteMembersPath = '/welcome/invite-members'

// -- Empty dashboard --
export const gettingStartedLabel = 'Getting started'
export const addSafeAccountsLabel = 'Add your Safe Accounts'
export const addAccountBtn = '[data-testid="add-space-account-button"]'
export const addAccountsModalLabel = 'Add Safe Accounts'
export const importAddressBookBtn = '[aria-label="Import address book"]'
export const importAddressBookLabel = 'Import address book'
export const dashboardAddMemberBtn = '[data-testid="add-member-button"]'
export const inviteMemberLabel = 'Add member'
export const learnMoreBtn = '[data-testid="spaces-learn-more-button"]'
export const exploreSpacesLabel = 'Introducing spaces'

// ===========================================
// Labels & regex patterns
// ===========================================

const spaceDashboardTotalValueLabelText = 'Total value'
const viewAllAccountsLabel = 'View all accounts'
const updateSuccessMsg = 'Updated space name'
const noSpacesStr = 'No spaces found'
const formattedSpaceTotalValuePattern = /^\$[\u200a\s]*[\d,]+\.\d{2}$/

export const nonZeroBalanceRegex = /\$[\u200a\s]*[1-9][\d,]*(?:\.\d{2})?/
export const zeroBalanceRegex = /\$[\u200a\s]*0(?:\.00)?/
export const txDetailsLabel = 'Transaction details'
export const pendingTxName = 'Send'
export const pendingTxStatus = 'Needs confirmation'
export const deleteSpaceConfirmationMsg = (name) => `Deleted space ${name}`

// ===========================================
// Internal helpers (selectors builders)
// ===========================================

function getAccountItem(index) {
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-row-${index}"]`
}

function getAccountExpandedPanel(rowIndex) {
  return `${spaceDashboardAccountsWidget} [data-testid="space-dashboard-accounts-expanded-${rowIndex}"]`
}

export function getPendingTxItem(index) {
  return `${pendingTxWidget} ${widgetItem}:eq(${index})`
}

function getSpaceId() {
  return cy.url().then((url) => {
    const match = url.match(/spaceId=(\d+)/)
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
  cy.contains('Sign in with').click()
}

export function waitForSpacesWelcomeReady() {
  cy.get(`${orgList}, ${spacesListCreateSpaceBtn}`, { timeout: 60000 })
    .filter(':visible')
    .should('have.length.at.least', 1)
}

export function visitSpaceDashboard(spaceId) {
  cy.visit(constants.spaceDashboardUrl + String(spaceId))
}

export function clickOnSpaceSelector() {
  cy.get(spaceSelectorBtn, { timeout: 15000 }).should('be.visible').click()
}

export function disconnectFromSpaceLevel() {
  navigation.clickOnWalletExpandMoreIcon()
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

function verifySafeSelectorNavigationPanel({
  expectedName,
  fullAddress,
  chainShortName,
  balanceRegex,
  ownersThreshold,
}) {
  const short = main.shortenAddress(fullAddress)
  const expectedLine = `${chainShortName}:${short}`
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
  cy.get(safeLevelNavigationBackToSpaceBtn).should('be.visible')
  cy.get(safeLevelNavigation).find(spaceSafesNavigationBlock).should('be.visible')
  cy.get(safeLevelNavigation).find(spaceChainNavigationButton).should('be.visible')
}

// ===========================================
// Safe Accounts page verify functions
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

export function editSpace(newName) {
  cy.get(spaceEditInput).clear().type(newName)
  cy.get(spaceSaveBtn).click()
  cy.contains(updateSuccessMsg).should('be.visible')
}

export function deleteSpace(name) {
  cy.get(spaceDeleteBtn).click({ force: true })
  cy.get(spaceConfirmDeleteBtn).click()
  cy.contains(noSpacesStr).should('be.visible')
}

function deleteAllSpaces() {
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

export function ensureReadyToCreateSpace() {
  cy.wait(2000)
  cy.get('body').then(($body) => {
    const hasSpaces = $body.find(spaceCard).length > 0
    if (hasSpaces) {
      deleteAllSpaces()
    }
    main.verifyElementsIsVisible([spacesListCreateSpaceBtn])
  })
}

// ===========================================
// Add account flow
// ===========================================

export function selectNetwork(network) {
  cy.get(netwrokSelector).click()
  cy.get(netwrokItem).contains(network).click()
}

export function addAccountManually(address, network) {
  cy.get(addSpaceAccountBtn).should('be.enabled').click()
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
  cy.get(addMemberBtn).should('be.enabled').click()
  cy.get(memberAddressInput).find('input').clear().type(address)
  cy.get(memberNameInput).find('input').clear().type(name)
  cy.get(addMemberModalBtn).should('be.enabled').click()
  cy.contains(name).should('be.visible')
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
  cy.get(`${spacesListCreateSpaceBtn}, ${orgSpaceInput}`, { timeout: 30000 })
    .filter(':visible')
    .first()
    .then(($el) => {
      if (!$el.is(orgSpaceInput)) {
        cy.wrap($el).click()
      }
    })
  cy.url().should('include', onboardingCreateSpacePath)
}

function submitSpaceName(name) {
  cy.get(orgSpaceInput).should('be.visible').clear().type(name)
  cy.get(createSpaceOnboardingContinueBtn).should('be.enabled').click()
}

function skipSelectSafesStep() {
  cy.url({ timeout: 30000 }).should('include', onboardingSelectSafesPath).and('include', 'spaceId=')
  cy.get(selectSafesSkipBtn).should('be.visible').click()
}

function skipInviteMembersStep() {
  cy.url().should('include', onboardingInviteMembersPath).and('include', 'spaceId=')
  cy.get(inviteMembersSkipBtn).should('be.visible').click()
}

function verifySpaceDashboardLoaded() {
  cy.url().should('include', constants.spaceDashboardUrl).and('include', 'spaceId=')
}

export function createSpaceViaOnboardingWithSkip(name) {
  navigateToCreateSpacePage()
  submitSpaceName(name)
  skipSelectSafesStep()
  skipInviteMembersStep()
  verifySpaceDashboardLoaded()
}
