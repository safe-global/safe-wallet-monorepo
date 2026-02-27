export const SAFE_SIDEBAR_PAGES = {
  OVERVIEW: 'Overview',
  ASSETS: 'Assets',
  TRANSACTIONS: 'Transactions',
  ADDRESS_BOOK: 'Address book',
  APPS: 'Apps',
  SWAP: 'Swap',
  BRIDGE: 'Bridge',
  EARN: 'Earn',
  STAKE: 'Stake',
}

export const SPACES_SIDEBAR_PAGES = {
  HOME: 'Home',
  ACCOUNTS: 'Accounts',
  ADDRESS_BOOK: 'Address book',
  TEAM: 'Team',
  SETTINGS: 'Settings',
}

// Safe Sidebar
export const backToSpaceBtn = '[data-testid="back-to-space-btn"]'
const safeSidebarListItem = '[data-testid="sidebar-list-item"]'

// Spaces Sidebar
const spaceSelectorDropdown = '[data-testid="space-selector-dropdown"]'
const spacesNavItem = (label) => `[data-testid="sidebar-item-${label.trim().toLowerCase().replace(/\s+/g, '-')}"]`
const dropdownMenu = '[role="menu"]'
const dropdownMenuItem = '[role="menuitem"]'

/**
 * Navigate to a page in the Safe sidebar
 * @param {string} pageName
 */
export function navigateToSafePage(pageName) {
  cy.get(safeSidebarListItem).contains(pageName).click({ force: true })
}

export function clickOnSafeOverview() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.OVERVIEW)
}

export function clickOnSafeAssets() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.ASSETS)
}

export function clickOnSafeTransactions() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.TRANSACTIONS)
}

export function clickOnSafeAddressBook() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.ADDRESS_BOOK)
}

export function clickOnSafeApps() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.APPS)
}

export function clickOnSafeSwap() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.SWAP)
}

export function clickOnSafeBridge() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.BRIDGE)
}

export function clickOnSafeEarn() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.EARN)
}

export function clickOnSafeStake() {
  navigateToSafePage(SAFE_SIDEBAR_PAGES.STAKE)
}

export function goBackToSpace() {
  cy.get(backToSpaceBtn).click({ force: true })
}

/**
 * Navigate to a page in the Spaces sidebar
 * @param {string} pageName
 */
export function navigateToSpacesPage(pageName) {
  cy.get(spacesNavItem(pageName)).click({ force: true })
}

export function clickOnSpacesHome() {
  navigateToSpacesPage(SPACES_SIDEBAR_PAGES.HOME)
}

export function clickOnSpacesAccounts() {
  navigateToSpacesPage(SPACES_SIDEBAR_PAGES.ACCOUNTS)
}

export function clickOnSpacesAddressBook() {
  navigateToSpacesPage(SPACES_SIDEBAR_PAGES.ADDRESS_BOOK)
}

export function clickOnSpacesTeam() {
  navigateToSpacesPage(SPACES_SIDEBAR_PAGES.TEAM)
}

export function clickOnSpacesSettings() {
  navigateToSpacesPage(SPACES_SIDEBAR_PAGES.SETTINGS)
}

export function openSpacesDropdown() {
  cy.get(spaceSelectorDropdown).click({ force: true })
  cy.get(dropdownMenu).should('be.visible')
}

export function closeSpacesDropdown() {
  cy.get('body').click(0, 0)
}

/**
 * Choose a specific space from the dropdown
 * @param {string} spaceName - Name of the space to select
 */
export function selectSpaceFromDropdown(spaceName) {
  openSpacesDropdown()
  cy.get(dropdownMenu).within(() => {
    cy.contains(dropdownMenuItem, spaceName).click({ force: true })
  })
}

export function clickCreateSpaceInDropdown() {
  openSpacesDropdown()
  cy.get(dropdownMenu).within(() => {
    cy.contains(dropdownMenuItem, 'Create space').click({ force: true })
  })
}

export function clickViewSpacesInDropdown() {
  openSpacesDropdown()
  cy.get(dropdownMenu).within(() => {
    cy.contains(dropdownMenuItem, 'View spaces').click({ force: true })
  })
}

/**
 * Verify a space is selected in the dropdown
 * @param {string} spaceName - Name of the space to verify
 */
export function verifySpaceIsSelectedInDropdown(spaceName) {
  cy.get(spaceSelectorDropdown).should('contain', spaceName)
}

export function verifySafePageExists(pageName) {
  cy.get(safeSidebarListItem).contains(pageName).should('be.visible')
}

export function getCurrentSpaceName() {
  return cy.get(spaceSelectorDropdown).invoke('text')
}
