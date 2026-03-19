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
