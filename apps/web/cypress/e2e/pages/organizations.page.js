import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import staticSafes from '../../fixtures/safes/static.json'

export const orgList = '[data-testid="org-list"]'
export const createOrgBtn = '[data-testid="create-org-button"]'
export const createOrgModalBtn = '[data-testid="create-org-modal-button"]'
export const orgNameInput = '[data-testid="org-name-input"]'
export const orgName = '[data-testid="org-name"]'
const orgSelectorBtn = '[data-testid="org-selector-button"]'
const orgSelectorMenu = '[data-testid="org-selector-menu"]'
const orgEditInput = 'input[name="name"]'
const orgSaveBtn = '[data-testid="org-save-button"]'
const updateSuccessMsg = 'Successfully updated organization name'

export function clickOnSignInBtn() {
  cy.contains('Sign in with').click()
  cy.get(createOrgBtn).should('be.enabled')
}

export function clickOnCreateOrgBtn() {
  cy.get(createOrgBtn).should('be.enabled').click()
}

export function clickOnCreateOrgModalBtn() {
  cy.get(createOrgModalBtn).should('be.enabled').click()
}

export function typeOrgName(name) {
  cy.get(orgNameInput).find('input').clear().type(name)
}

export function clickOnOrgSelector() {
  cy.get(orgSelectorBtn).click()
}

export function orgExists(name) {
  cy.get(orgSelectorMenu).contains(name).should('be.visible')
}


export function createOrganization(name) {
  clickOnCreateOrgBtn()
  typeOrgName(name)
  clickOnCreateOrgModalBtn()
}

export function getOrgId() {
  cy.url().then((url) => {
    const orgId = url.match(/orgId=(\d+)/)[1];
    return orgId;
  });
}

export function goToOrgSettings() {
  cy.visit(constants.orgUrl + getOrgId())
}

export function goToOrgMembers() {
  cy.visit(constants.orgMembersUrl + getOrgId())
}


export function clickOnSaveOrgNamebtn() {
  cy.get(orgSaveBtn).click()
}

export function editOrganization(newName) {
  cy.get(orgEditInput).clear().type(newName)
  clickOnSaveOrgNamebtn()
  cy.contains(updateSuccessMsg).should('be.visible')
  cy.contains(updateSuccessMsg).should('not.be.visible')
}

const orgDeleteBtn = '[data-testid="org-delete-button"]'
const orgConfirmDeleteBtn = '[data-testid="org-confirm-delete-button""]'
const orgAddManuallyBtn = '[data-testid="add-manually-button"]'
const addOrgAccountBtn = '[data-testid="add-org-account-button"]'

export function deleteOrganization(name) {
  cy.get(orgDeleteBtn).click()
  cy.get(orgConfirmDeleteBtn).click()
  cy.contains(name).should('not.exist')
}

export function clickOnAddAccountBtn() {
  cy.get(addOrgAccountBtn).click()
}
export function clickOnAddAccountManuallyBtn() {
  cy.get(orgAddManuallyBtn).click()
}

const addAddressInput = '[data-testid="org-add-address-input"]'


const netwrokItem = '[data-testid="network-item"]'

export function selectNetwork(network) {
  cy.get(netwrokItem).click()
  cy.get(netwrokItem).contains(network).click()
}

export function setAddress(address) {
  cy.get(addAddressInput).find('input').clear().type(address)
  cy.get(addAddressInput).find('input').should('have.value', address)
}

const dashboardSafeList = '[data-testid="dashboard-safe-list"]'

export function accountIsOndashboard(address) {
  const shortAddress = main.shortenAddress(address)
  cy.get(dashboardSafeList).contains(shortAddress).should('be.visible')
}

export function addAccountManually(address, network) {
  const shortAddress = main.shortenAddress(address)
  clickOnAddAccountBtn()
  clickOnAddAccountManuallyBtn()
  selectNetwork(network)
  setAddress(address)
  clickOnAddAccountBtn()
  cy.contains(shortAddress).should('be.visible')
  clickOnAddAccountBtn()
  accountIsOndashboard(address)
}
const addMemberBtn = '[data-testid="add-member-button"]'
const addMemberModalBtn = '[data-testid="add-member-modal-button"]'
const memberAddressInput = '[data-testid="member-address-input"]'
const memberNameInput = '[data-testid="member-name-input"]'

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
  cy.get(pendingInvitationsList).contains(name).should('be.visible')
}


export function addMember(name, address) {
  clickOnAddMemberBtn()
  typeMemberAddress(address)
  typeMemberName(name)
  clickOnAddMemberModalBtn()
  memberIsInList(name)
}

