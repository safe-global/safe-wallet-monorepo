import * as main from '../pages/main.page'
import { connectedWalletExecMethod, relayExecMethod, connectedWalletMethod } from '../pages/create_tx.pages'
import * as sidebar from '../pages/sidebar.pages'
import * as constants from '../../support/constants'

const welcomeLoginScreen = '[data-testid="welcome-login"]'
const expandMoreIcon = 'svg[data-testid="ExpandMoreIcon"]'
const newtworkSelectorDiv = 'div[class*="networkSelector"]'
const nameInput = 'input[name="name"]'
const ownerInput = 'input[name^="owners"][name$="name"]'
const ownerAddress = 'input[name^="owners"][name$="address"]'
const thresholdInput = 'input[name="threshold"]'
export const removeOwnerBtn = 'button[aria-label="Remove signer"]'
const connectingContainer = 'div[class*="connecting-container"]'
const createNewSafeBtn = '[data-testid="create-safe-btn"]'
const continueWithWalletBtn = 'Continue with Private key'
const googleConnectBtn = '[data-testid="google-connect-btn"]'
const googleSignedinBtn = '[data-testid="signed-in-account-btn"]'
export const accountInfoHeader = '[data-testid="open-account-center"]'
export const reviewStepOwnerInfo = '[data-testid="review-step-owner-info"]'
export const reviewStepNextBtn = '[data-testid="review-step-next-btn"]'
const creationModalLetsGoBtn = '[data-testid="cf-creation-lets-go-btn"]'
const safeCreationStatusInfo = '[data-testid="safe-status-info"]'
const startUsingSafeBtn = '[data-testid="start-using-safe-btn"]'
const sponsorIcon = '[data-testid="sponsor-icon"]'
const networkFeeSection = '[data-tetid="network-fee-section"]'
const nextBtn = '[data-testid="next-btn"]'
const backBtn = '[data-testid="back-btn"]'
const cancelBtn = '[data-testid="cancel-btn"]'
const safeActivationSection = '[data-testid="activation-section"]'
export const addressAutocompleteOptions = '[data-testid="address-item"]'
export const qrCode = '[data-testid="qr-code"]'
export const addressInfo = '[data-testid="address-info"]'
export const choiceBtn = '[data-testid="choice-btn"]'
const addFundsBtn = '[data-testid="add-funds-btn"]'
const createTxBtn = '[data-testid="create-tx-btn"]'
const qrCodeSwitch = '[data-testid="qr-code-switch"]'
export const activateAccountBtn = '[data-testid="activate-account-btn-cf"]'
export const activateFlowAccountBtn = '[data-testid="activate-account-flow-btn"]'
const notificationsSwitch = '[data-testid="notifications-switch"]'
export const addFundsSection = '[data-testid="add-funds-section"]'
export const noTokensAlert = '[data-testid="no-tokens-alert"]'
const networkCheckbox = '[data-testid="network-checkbox"]'
const cancelIcon = '[data-testid="CancelIcon"]'
const thresholdItem = '[data-testid="threshold-item"]'
export const payNowLaterMessageBox = '[data-testid="pay-now-later-message-box"]'
export const safeSetupOverview = '[data-testid="safe-setup-overview"]'
export const networksLogoList = '[data-testid="network-list"]'
export const reviewStepSafeName = '[data-testid="review-step-safe-name"]'
export const reviewStepThreshold = '[data-testid="review-step-threshold"]'
export const cfSafeCreationSuccessMsg = '[data-testid="account-success-message"]'
export const cfSafeActivationMsg = '[data-testid="safe-activation-message"]'
export const cfSafeInfo = '[data-testid="safe-info"]'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
const networkSelectorItem = '[data-testid="network-selector-item"]'

const sponsorStr = 'Your account is sponsored by Goerli'
const safeCreationProcessing = 'Transaction is being executed'
const safeCreationComplete = 'Your Safe Account is being indexed'
const changeNetworkWarningStr = 'Change your wallet network'
const policy1_2 = '1/1 policy'
export const walletName = 'test1-sepolia-safe'
export const defaultSepoliaPlaceholder = 'Sepolia Safe'
const welcomeToSafeStr = 'Welcome to Safe'
const initialSteps = '0 of 2 steps completed'
export const addSignerStr = 'Add signer'
export const accountRecoveryStr = 'Account recovery'
export const sendTokensStr = 'Send tokens'
const noWalletConnectedMsg = 'No wallet connected'
export const deployWalletStr = 'about to deploy this Safe Account'
const showAllNetworksStr = 'Show all networks'

export function waitForConnectionMsgDisappear() {
  cy.contains(noWalletConnectedMsg).should('not.exist')
}
export function checkNotificationsSwitchIs(status) {
  cy.get(notificationsSwitch).find('input').should(`be.${status}`)
}

export function clickOnActivateAccountBtn(index) {
  cy.get(activateAccountBtn).eq(index).click()
}

export function clickOnFinalActivateAccountBtn(index) {
  cy.get(activateFlowAccountBtn).click()
}

export function clickOnQRCodeSwitch() {
  cy.get(qrCodeSwitch).click()
}

export function checkQRCodeSwitchStatus(state) {
  cy.get(qrCodeSwitch).find('input').should(state)
}

export function checkInitialStepsDisplayed() {
  cy.contains(initialSteps).should('be.visible')
}

export function clickOnAddFundsBtn() {
  cy.get(addFundsBtn).click()
}

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

export function verifyCFSafeCreated() {
  main.verifyElementsIsVisible([sidebar.pendingActivationIcon, safeActivationSection])
}

export function selectPayNowOption() {
  cy.get(connectedWalletMethod).click()
}

export function selectRelayOption() {
  cy.get(relayExecMethod).click()
}

export function cancelWalletCreation() {
  cy.get(cancelBtn).click()
  cy.get('button').contains(continueWithWalletBtn).should('be.visible')
}

export function clickOnBackBtn() {
  cy.get(backBtn).should('be.enabled').click()
}
export function verifySafeIsBeingCreated() {
  cy.get(safeCreationStatusInfo).should('have.text', safeCreationProcessing)
}

export function verifySafeCreationIsComplete() {
  cy.get(safeCreationStatusInfo).should('exist').and('have.text', safeCreationComplete)
  cy.get(startUsingSafeBtn).should('exist').click()
  cy.get(welcomeToSafeStr).should('exist')
}

export function clickOnReviewStepNextBtn() {
  cy.get(reviewStepNextBtn).click()
  cy.get(reviewStepNextBtn, { timeout: 60000 }).should('not.exist')
}

export function clickOnLetsGoBtn() {
  cy.get(creationModalLetsGoBtn).click()
  return cy.get(creationModalLetsGoBtn, { timeout: 60000 }).should('not.exist')
}

export function verifyOwnerInfoIsPresent() {
  return cy.get(reviewStepOwnerInfo).shoul('exist')
}

export function verifySponsorMessageIsPresent() {
  main.verifyElementsExist([sponsorIcon, networkFeeSection])
  // Goerli is generated
  cy.get(networkFeeSection).contains(sponsorStr).should('exist')
}

export function verifyPolicy1_1() {
  cy.contains(policy1_2).should('exist')
  // TOD: Need data-cy for containers
}

export function verifyDefaultWalletName(name) {
  cy.get(nameInput).invoke('attr', 'placeholder').should('include', name)
}

export function verifyNextBtnIsDisabled() {
  cy.get('button').contains('Next').should('be.disabled')
}

export function verifyNextBtnIsEnabled() {
  cy.get('button').contains('Next').should('not.be.disabled')
}

export function checkNetworkChangeWarningMsg() {
  cy.get('div').contains(changeNetworkWarningStr).should('exist')
}

export function clickOnCreateNewSafeBtn() {
  cy.get(createNewSafeBtn).click().wait(1000)
}

export function clickOnContinueWithWalletBtn() {
  cy.get('button').contains(continueWithWalletBtn).click().wait(1000)
}

export function verifyConnectWalletBtnDisplayed() {
  return cy.get(connectWalletBtn).should('be.visible')
}
export function clickOnConnectWalletBtn() {
  cy.get(welcomeLoginScreen).within(() => {
    verifyConnectWalletBtnDisplayed().should('be.enabled').click().wait(1000)
  })
}

export function typeWalletName(name) {
  cy.get(nameInput).type(name).should('have.value', name)
}

export function clearWalletName() {
  cy.get(nameInput).clear()
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
  cy.get(networkCheckbox).eq(0).click()
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

export function clickOnNetwrokRemoveIcon() {
  cy.get(cancelIcon).click()
}

export function clickOnNextBtn() {
  cy.get(nextBtn).should('be.enabled').click()
}

export function verifyOwnerName(name, index) {
  cy.get(ownerInput).eq(index).should('have.value', name)
}

export function verifyOwnerAddress(address, index) {
  cy.get(ownerAddress).eq(index).should('have.value', address)
}

export function verifyThreshold(number) {
  cy.get(thresholdInput).should('have.value', number)
}

export function clickOnSignerAddressInput(index) {
  cy.get(getOwnerAddressInput(index)).clear()
}

export function selectSignerOnAutocomplete(index) {
  cy.wait(500)
  cy.get(addressAutocompleteOptions).eq(index).click()
}

export function typeOwnerName(name, index) {
  cy.get(getOwnerNameInput(index)).type(name).should('have.value', name)
}

export function typeOwnerAddress(address, index, clearOnly = false) {
  if (clearOnly) {
    cy.get(getOwnerAddressInput(index)).clear()
    cy.get('body').click()
    return
  }
  cy.get(getOwnerAddressInput(index)).clear().type(address).should('have.value', address)
}

export function clickOnAddNewOwnerBtn() {
  cy.contains('button', 'Add new signer').click().wait(700)
}

export function addNewOwner(name, address, index) {
  clickOnAddNewOwnerBtn()
  typeOwnerName(name, index)
  typeOwnerAddress(address, index)
}

export function updateThreshold(number) {
  cy.get(thresholdInput).parent().click()
  cy.get(thresholdItem).contains(number).click()
}

export function removeOwner(index) {
  // Index for remove owner btn which does not equal to number of owners
  cy.get(removeOwnerBtn).eq(index).click()
}

export function verifySafeNameInSummaryStep(name) {
  cy.contains(name)
}

export function verifyOwnerNameInSummaryStep(name) {
  cy.contains(name)
}

export function verifyOwnerAddressInSummaryStep(address) {
  cy.contains(address)
}

export function verifyThresholdStringInSummaryStep(startThreshold, endThreshold) {
  cy.contains(`${startThreshold} out of ${endThreshold}`)
}

export function verifySafeNetworkNameInSummaryStep(name) {
  cy.get('div').contains('Name').parent().parent().contains(name)
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

function getOwnerNameInput(index) {
  return `input[name="owners.${index}.name"]`
}

function getOwnerAddressInput(index) {
  return `input[name="owners.${index}.address"]`
}

export function assertCFSafeThresholdAndSigners(chainId, threshold, expectedOwnersCount, lsdata) {
  const localStorageData = lsdata
  const data = JSON.parse(localStorageData)
  let thresholdFound = false

  for (const address in data[chainId]) {
    const safe = data[chainId][address]

    if (safe.props.safeAccountConfig.threshold === threshold) {
      thresholdFound = true

      const ownersCount = safe.props.safeAccountConfig.owners.length
      if (ownersCount !== expectedOwnersCount) {
        throw new Error(
          `Safe at address ${address} on chain ID ${chainId} has ${ownersCount} owners, expected ${expectedOwnersCount}.`,
        )
      }

      console.log(`Safe with threshold ${threshold} and ${expectedOwnersCount} owners exists on chain ID ${chainId}.`)
      break
    }
  }

  if (!thresholdFound) {
    throw new Error(`No safe found with threshold ${threshold} on chain ID ${chainId}.`)
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
