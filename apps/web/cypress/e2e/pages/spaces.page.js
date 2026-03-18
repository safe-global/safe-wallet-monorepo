import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import staticSafes from '../../fixtures/safes/static.js'
import { tableContainer } from './address_book.page.js'

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
  cy.get(orgSpaceInput).find('input').clear().type(name)
}

export function clickOnSpaceSelector() {
  cy.get(spaceSelectorBtn).click()
}

export function spaceExists(name) {
  cy.get(spaceSelectorMenu).contains(name).should('be.visible')
}

export function createSpace(name) {
  clickOnCreateSpaceBtn()
  typeSpaceName(name)
  clickOnCreateSpaceModalBtn()
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
// Dashboard selectors
// ===========================================

// Test data constants
export const testSpaceId = '2343'
export const emptySpaceId = '2362'
export const testSpaceName = 'Automation Test Space'
export const firstAccountAddress = '0x1694...23C7'
export const secondAccountAddress = '0x0596...197b'
export const secondAccountName = 'Space addressbook name'
export const pendingTxName = 'addOwnerWithThre'
export const pendingTxStatus = 'Execution needed'
export const pendingTxBatchLabel = 'Batch'
export const txDetailsLabel = 'Transaction details'
export const gettingStartedLabel = 'Getting started'
export const addSafeAccountsLabel = 'Add your Safe Accounts'
export const addAccountsModalLabel = 'Add accounts'
export const importAddressBookLabel = 'Import address book'
export const inviteMemberLabel = 'Invite member'
export const exploreSpacesLabel = 'Explore spaces'
export const viewAllAccountsLabel = 'View all accounts'

export const widgetItem = '[data-slot="widget-item"]'
export const safeWidget = '[data-slot="safe-widget"]'
export const pendingTxWidget = '[data-testid="pending-tx-widget"]'
export const backToSpaceBtn = '[aria-label="Back to space"]'

export function getPendingTxItem(index) {
  return `[data-testid="pending-tx-item-${index}"]`
}

export function getAccountItem(index) {
  return `[data-testid="account-item-${index}"]`
}
export const headerWalletBtn = '[data-testid="header-wallet-btn"]'
export const importAddressBookBtn = '[data-testid="import-address-book-button"]'
export const dashboardAddMemberBtn = '[data-testid="add-member-button"]'
export const learnMoreBtn = '[data-testid="learn-more-button"]'
export const addAccountBtn = '[data-testid="add-space-account-button"]'
export const sidebarItemHome = '[data-testid="sidebar-item-home"]'
export const sidebarItemAccounts = '[data-testid="sidebar-item-accounts"]'
export const sidebarItemAddressBook = '[data-testid="sidebar-item-address-book"]'
export const sidebarItemTeam = '[data-testid="sidebar-item-team"]'
export const sidebarItemSettings = '[data-testid="sidebar-item-settings"]'

// ===========================================
// Login & Navigation helpers
// ===========================================

export function loginWithSiwe() {
  clickOnSignInBtn()
  // Wait for the spaces page to load after SIWE authentication
  cy.get(spaceSelectorBtn).should('be.visible')
  cy.url().should('include', '/spaces')
}

export function openSpace(spaceName) {
  cy.wait(2000)
  cy.get('body').then(($body) => {
    if ($body.find(spaceSelectorBtn).length > 0) {
      clickOnSpaceSelector()
      cy.get(spaceSelectorMenu).contains(spaceName).click()
    } else {
      cy.contains(spaceName).click()
    }
  })
}

export function goToSpaceDashboard() {
  getSpaceId().then((spaceId) => {
    cy.visit(constants.spaceDashboardUrl + spaceId)
  })
}

export function goToSpaceAccounts() {
  getSpaceId().then((spaceId) => {
    cy.visit(constants.spaceSafeAccountsUrl + spaceId)
  })
}

export function goToSpaceAddressBook() {
  getSpaceId().then((spaceId) => {
    cy.visit(constants.spaceAddressBookUrl + spaceId)
  })
}

export function verifySidebarItemNavigates(sidebarSelector, expectedPath) {
  cy.get(sidebarSelector).click()
  cy.url().should('include', expectedPath)
}

export function verifyWidgetVisible(widgetTitle) {
  cy.contains(widgetTitle, { timeout: 30000 }).should('be.visible')
}

export function disconnectFromSpaceLevel() {
  cy.get(headerWalletBtn).click()
  cy.get('button').contains('Disconnect').click()
}
