import * as main from '../pages/main.page'
import { connectedWalletExecMethod, relayExecMethod } from '../pages/create_tx.pages'
import * as sidebar from '../pages/sidebar.pages'
import * as constants from '../../support/constants'
import * as wallet from '../../support/utils/wallet'
import * as owner from './owners.pages'

export const removeOwnerBtn = 'button[aria-label="Remove signer"]'
// Welcome "My accounts" redesign (V2): creation lives behind the "Add accounts" chooser rather than a
// standalone create-safe button.
const addAccountsChooserBtn = '[data-testid="open-add-accounts-chooser-button"]'
const createNewAccountOption = '[data-testid="add-accounts-create-new"]'
const continueWithWalletBtn = 'Continue with Private key'
export const accountInfoHeader = '[data-testid="open-account-center"]'
const nextBtn = '[data-testid="next-btn"]'
const backBtn = '[data-testid="back-btn"]'
export const choiceBtn = '[data-testid="choice-btn"]'
const createTxBtn = '[data-testid="create-tx-btn"]'
export const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
export const continueWithWalletBtnConnected = '[data-testid="continue-with-wallet-btn"]'
const networkSelectorItem = '[data-testid="network-selector-item"]'

export const addSignerStr = 'Add signer'
export const accountRecoveryStr = 'Account recovery'
export const sendTokensStr = 'Send tokens'

export function clickOnCreateTxBtn() {
  cy.get(createTxBtn).click()
  main.verifyElementsCount(choiceBtn, 6)
}

export function checkAllTxTypesOrder(expectedOrder) {
  main.checkTextOrder(choiceBtn, expectedOrder)
}

export function clickOnTxType(tx) {
  cy.get(choiceBtn).contains(tx).click()
}

export function selectRelayOption() {
  cy.get(relayExecMethod).click()
}

export function clickOnBackBtn() {
  main.clickOnBackBtn(backBtn)
}

const CHOOSER_ATTEMPTS = 3

// A click on the "Add accounts" chooser that comes right after the page renders can be lost, so click again.
function openAddAccountsChooser(attemptsLeft = CHOOSER_ATTEMPTS) {
  cy.get(addAccountsChooserBtn).filter(':visible').first().click()
  main
    .pollUntil(() => Cypress.$(`${createNewAccountOption}:visible`).length > 0, 2000)
    .then((opened) => {
      if (opened) return
      if (attemptsLeft <= 1) throw new Error('The "Add accounts" chooser did not open')
      openAddAccountsChooser(attemptsLeft - 1)
    })
}

export function clickOnContinueWithWalletBtn() {
  cy.get('button').contains(continueWithWalletBtn).click().wait(1000)
}

export function verifyConnectWalletBtnDisplayed() {
  return cy.get(connectWalletBtn).should('be.visible')
}

export function openNetworkSelector() {
  cy.get(networkSelectorItem).should('be.visible').click({ force: true })
}
export function selectNetwork(network) {
  cy.wait(1000)
  openNetworkSelector()
  cy.wait(1000)
  let regex = new RegExp(`^${network}$`)
  cy.get('li').parents('ul').contains(regex).click()
}

export function clickOnNextBtn() {
  main.clickOnNextBtn(nextBtn)
}

export function typeOwnerAddress(address, index, clearOnly = false) {
  if (clearOnly) {
    cy.get(getOwnerAddressInput(index)).clear()
    cy.get('body').click()
    return
  }
  cy.get(getOwnerAddressInput(index)).clear().type(address).should('have.value', address)
}

export function verifyEstimatedFeeInSummaryStep() {
  cy.get('b')
    .contains('ETH')
    .parent()
    .should(($element) => {
      const text = 'a' + $element.text()
      const pattern = /\d/
      expect(/\d/.test(text)).to.equal(true)
    })
}

function getOwnerAddressInput(index) {
  return `input[name="owners.${index}.address"]`
}
