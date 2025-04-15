import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import staticSafes from '../../fixtures/safes/static.json'
import { tableContainer } from './address_book.page.js'

export const orgList = '[data-testid="org-list"]'
export const createSpaceBtn = '[data-testid="create-space-button"]'
export const createSpaceModalBtn = '[data-testid="create-space-modal-button"]'
export const orgSpaceInput = '[data-testid="space-name-input"]'
export const orgName = '[data-testid="org-name"]'
const spaceSelectorBtn = '[data-testid="space-selector-button"]'
const spaceSelectorMenu = '[data-testid="space-selector-menu"]'
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
const dashboardSafeList = '[data-testid="dashboard-safe-list"]'
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

const pendingInvitationsList = '[data-testid="pending-invitations-list"]'

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
