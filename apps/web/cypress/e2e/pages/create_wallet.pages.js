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
export const reviewStepOwnerInfo = '[data-testid="review-step-owner-info"]'
export const reviewStepNextBtn = '[data-testid="review-step-next-btn"]'
const creationModalLetsGoBtn = '[data-testid="cf-creation-lets-go-btn"]'
const nextBtn = '[data-testid="next-btn"]'
const backBtn = '[data-testid="back-btn"]'
export const choiceBtn = '[data-testid="choice-btn"]'
const createTxBtn = '[data-testid="create-tx-btn"]'
export const activateAccountBtn = '[data-testid="activate-account-btn-cf"]'
const networkCheckbox = '[data-testid="network-checkbox"]'
const cancelIcon = '[data-testid="CancelIcon"]'
export const payNowLaterMessageBox = '[data-testid="pay-now-later-message-box"]'
export const safeSetupOverview = '[data-testid="safe-setup-overview"]'
export const networksLogoList = '[data-testid="network-list"]'
export const reviewStepSafeName = '[data-testid="review-step-safe-name"]'
export const reviewStepThreshold = '[data-testid="review-step-threshold"]'
export const cfSafeCreationSuccessMsg = '[data-testid="account-success-message"]'
export const cfSafeActivationMsg = '[data-testid="safe-activation-message"]'
export const cfSafeInfo = '[data-testid="safe-info"]'
export const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
export const continueWithWalletBtnConnected = '[data-testid="continue-with-wallet-btn"]'
const networkSelectorItem = '[data-testid="network-selector-item"]'
const signInToWorkspaceBtn = '[data-testid="sign-in-to-workspace-btn"]'

export const addSignerStr = 'Add signer'
export const accountRecoveryStr = 'Account recovery'
export const sendTokensStr = 'Send tokens'
export const yourSafeAccountPreviewStr = 'Your Safe account preview'

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

export function clickOnSignInToWorkspaceBtn() {
  cy.get(signInToWorkspaceBtn).should('be.visible').click()
  // Single-network Next is enabled before sign-in finishes; the link disappears once pay later is selected.
  cy.get(signInToWorkspaceBtn).should('not.exist')
  cy.get(reviewStepNextBtn).should('not.be.disabled')
}

export function clickOnReviewStepNextBtn() {
  cy.get(reviewStepNextBtn).click()
  cy.get(reviewStepNextBtn, { timeout: 600000 }).should('not.exist')
}

export function clickOnLetsGoBtn() {
  // After activation the modal only opens once the deployment is mined and indexed, which can
  // take well over a minute on Sepolia when the RPC is throttled.
  cy.get(creationModalLetsGoBtn, { timeout: 180000 }).click()
  return cy.get(creationModalLetsGoBtn, { timeout: 60000 }).should('not.exist')
}

// Reads the created safe's address so assertions target the exact safe, not other
// same-creator safes synced in after "Sign in to workspace".
export function getCreatedSafeAddress() {
  return cy
    .get(cfSafeInfo)
    .invoke('text')
    .then((text) => {
      const match = text.match(/0x[0-9a-fA-F]{40}/)
      if (!match) {
        throw new Error(`Could not find a safe address in the creation success screen: "${text}"`)
      }
      return match[0]
    })
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

export function clickOnCreateNewSafeBtn() {
  // Open the "Add accounts" chooser, then pick "Create new" to enter the create-safe flow.
  openAddAccountsChooser()
  cy.get(createNewAccountOption).should('be.visible').click()
  cy.location('pathname').should('include', '/new-safe/create')
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

export function selectMultiNetwork(index, network) {
  clickOnMultiNetworkInput(index)
  enterNetwork(index, network)
  clickOnNetwrokCheckbox()
}

export function clickOnNetwrokCheckbox() {
  // The checkbox itself is decorative (pointer-events: none); the click handler is on the option row.
  cy.get(networkCheckbox).eq(0).closest('li[role="option"]').click()
}
export function enterNetwork(index, network) {
  cy.get('input').eq(index).type(network)
}
export function clickOnMultiNetworkInput(index) {
  cy.get('input').eq(index).click()
}

export function clearNetworkInput(index) {
  cy.get('input').eq(index).click()
  cy.get(cancelIcon).click()
}

export function clickOnNextBtn() {
  main.clickOnNextBtn(nextBtn)
}

export function clickOnYourSafeAccountPreview() {
  cy.contains(yourSafeAccountPreviewStr).click()
}

export function typeOwnerAddress(address, index, clearOnly = false) {
  if (clearOnly) {
    cy.get(getOwnerAddressInput(index)).clear()
    cy.get('body').click()
    return
  }
  cy.get(getOwnerAddressInput(index)).clear().type(address).should('have.value', address)
}

export function updateThreshold(number) {
  owner.clickOnThresholdDropdown()
  owner.getThresholdOptions().contains(number).trigger('mousemove').click()
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

export function assertCFSafeThresholdAndSigners(chainId, threshold, expectedOwnersCount, lsdata, safeAddress) {
  const data = JSON.parse(lsdata)
  const chainSafes = data[chainId] || {}
  const matchedAddress = Object.keys(chainSafes).find((addr) => addr.toLowerCase() === safeAddress.toLowerCase())
  const safe = matchedAddress ? chainSafes[matchedAddress] : undefined

  if (!safe) {
    throw new Error(`No safe found at address ${safeAddress} on chain ID ${chainId}.`)
  }

  const actualThreshold = safe.props.safeAccountConfig.threshold
  if (actualThreshold !== threshold) {
    throw new Error(
      `Safe at address ${safeAddress} on chain ID ${chainId} has threshold ${actualThreshold}, expected ${threshold}.`,
    )
  }

  const ownersCount = safe.props.safeAccountConfig.owners.length
  if (ownersCount !== expectedOwnersCount) {
    throw new Error(
      `Safe at address ${safeAddress} on chain ID ${chainId} has ${ownersCount} owners, expected ${expectedOwnersCount}.`,
    )
  }
}

function checkNetworkLogo(network) {
  cy.get('img').then((logos) => {
    const isLogoPresent = [...logos].some((img) => img.getAttribute('src').includes(network))
    expect(isLogoPresent).to.be.true
  })
}

export function checkNetworkLogoInReviewStep(networks) {
  cy.get(networksLogoList).within(() => {
    networks.forEach((network) => {
      checkNetworkLogo(network)
    })
  })
}

export function checkNetworkLogoInSafeCreationModal(networks) {
  cy.get(cfSafeInfo).within(() => {
    networks.forEach((network) => {
      checkNetworkLogo(network)
    })
  })
}

/** Opens the create-Safe form with the wallet connected first, so the form preselects the wallet's network. */
export function startCreateSafeFlow(signer, chain = 'sep') {
  wallet.connectSignerViaStorage(signer, `${constants.welcomeAccountUrl}?chain=${chain}`)
  owner.waitForConnectionStatus()
  clickOnCreateNewSafeBtn()
}
