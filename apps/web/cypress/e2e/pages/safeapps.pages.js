import * as constants from '../../support/constants'
import { accordionActionItem } from '../pages/nfts.pages'

const searchAppInput = 'input[id="search-by-name"]'
const appUrlInput = 'input[name="appUrl"]'
const closePreviewWindowBtn = 'button[aria-label*="Close"][aria-label*="preview"]'
export const contractMethodIndex = '[name="contractMethodIndex"]'
export const saveToLibraryBtn = 'button[title="Save to Library"]'
export const downloadBatchBtn = 'button[title="Download batch"]'
export const deleteBatchBtn = 'button[title="Delete Batch"]'
const appModal = '[data-testid="app-info-modal"]'
export const safeAppsList = '[data-testid="apps-list"]'
const openSafeAppBtn = '[data-testid="open-safe-app-btn"]'
const appMessageInput = 'input[placeholder="Message"]'
const txBuilderUntrustedFallbackAlert = '[data-testid="untrusted-fallback-handler-alert"]'
export const handlerInput = 'input[id="contract-field-handler"]'
const decodedTxSummary = '[data-testid="decoded-tx-summary"]'
export const cowFallBackHandlerTitle = 'div[title="CowSwapFallbackHandler"]'

const addBtnStr = /add/i
const noAppsStr = /no Safe Apps found/i
const bookmarkedAppsStr = /bookmarked Apps/i
const customAppsStr = /my custom Apps/i
const addCustomAppBtnStr = /add custom Safe App/i
const openSafeAppBtnStr = /open Safe App/i
const disclaimerTtle = /disclaimer/i
const continueBtnStr = /continue/i
const cameraCheckBoxStr = /camera/i
const microfoneCheckBoxStr = /microphone/i
const permissionRequestStr = /permissions request/i
const accessToAddressBookStr = /access to your address book/i
const acceptBtnStr = /accept/i
const clearAllBtnStr = /clear all/i
const allowAllPermissions = /allow all/i
export const enterAddressStr = /enter address or ens name/i
export const addTransactionStr = /add new transaction/i
export const createBatchStr = /create batch/i
export const sendBatchStr = /send batch/i
export const transactionDetailsStr = /transaction details/i
export const addOwnerWithThreshold = /add signer with threshold/i
export const enterABIStr = /Enter ABI/i
export const toAddressStr = /to address/i
export const tokenAmount = /ETH value */i
export const dataStr = /data */i
export const clearTransactionListStr = /Clear transaction list?/i
export const confirmClearTransactionListStr = /Yes, clear/i
export const cancelBtnStr = 'Cancel'
export const confirmDeleteBtnStr = 'Yes, delete'
export const backBtnStr = /Back/i
export const simulateBtnStr = /Simulate/i
export const reviewAndConfirmStr = /Review and confirm/i
export const backToTransactionStr = /Back to Transaction Creation/i
export const batchNameStr = /Batch name/i
export const transactionLibraryStr = /Your transaction library/i
export const noSavedBatchesStr = /You don't have any saved batches./i
export const keepProxiABIStr = /Keep Proxy ABI/i
export const selectAllRowsChbxStr = /Select All Rows checkbox/i
export const selectRowChbxStr = /Select Row checkbox/i
export const recipientStr = /recipient/i
export const validRecipientAddressStr = /please enter a valid recipient address/i
export const contractMethodSelector = 'input[id="contract-method-selector"]'
export const testAddressValue2 = 'testAddressValue'
export const testBooleanValue = 'testBooleanValue'
export const testFallback = 'fallback'
export const cowFallback = 'setFallbackHandler'
export const customData = 'Custom hex data'
export const testBooleanValue1 = '1 testBooleanValue'
export const testBooleanValue2 = '2 testBooleanValue'
export const testBooleanValue3 = '3 testBooleanValue'
export const transfer2AssetsStr = 'Transfer 2 assets'

export const testTransfer1 = '1 transfer'
export const testTransfer2 = '2 MetaMultiSigWallet: transfer'
export const nativeTransfer2 = /2 Send.*ETH to.*/
export const nativeTransfer1 = '1 native transfer'

export const testNativeTransfer = 'native transfer'

export const newValueBool = 'newValue(bool):'
export const ownerAddressStr = 'signer (address)'
export const ownerAddressStr2 = 'signer(address)'
export const thresholdStr = '_threshold (uint256) *'
export const thresholdStr2 = '_threshold(uint256):'

const appNotSupportedMsg = "The app doesn't support Safe App functionality"
export const changedPropertiesStr = 'This batch contains some changed properties since you saved or downloaded it'
export const anotherChainStr = 'This batch is from another Chain (1)!'
export const useImplementationABI = 'Use Implementation ABI'
export const addressNotValidStr = 'The address is not valid'
export const transferEverythingStr = 'Transfer everything'
export const noTokensSelectedStr = 'No tokens selected'
export const reviewConfirmStr = 'Review and Confirm'
export const requiredStr = 'Required'
export const e3eTestStr = 'E2E test'
export const createBtnStr = 'Create'
export const warningStr = 'Warning'
export const transferStr = 'Transfer'
export const successStr = 'Success'
export const failedStr = 'Failed'
const blindSigningStr = 'This request involves blind signing'
const enableBlindSigningStr = 'Enable blind signing'
const blindSigningStr2 = 'blind signing'
const signBtnStr = 'Sign'

export const dummyTxStr = 'Trigger dummy tx (safe.txs.send)'
export const signOnchainMsgStr = 'Sign message (on-chain)'
export const pinWalletConnectStr = /pin walletconnect/i
export const transactionBuilderStr = 'Transaction Builder'
export const cowswapStr = 'CowSwap'
export const basicTypesTestContractStr = 'BasicTypesTestContract'
export const testAddressValueStr = 'testAddressValue'

export function checkActions(count, action) {
  cy.get(accordionActionItem).filter(`:contains("${action}")`).should('have.length', count)
}

export const logoWalletConnect = /logo.*walletconnect/i
export const walletConnectHeadlinePreview = /walletconnect/i
export const newAddressValueStr = 'newValue (address)'
export const newAddressValueStr2 = 'newValue(address)'
export const transactiobUilderHeadlinePreview = 'Transaction Builder'
export const availableNetworksPreview = 'Available networks'
export const connecttextPreview = 'Compose custom contract interactions and batch them into a single transaction'
export const AddressEmptyCodeStr = 'AddressEmptyCode'
export const gridItem = 'main .MuiPaper-root > .MuiGrid-item'
export const linkNames = {
  wcLogo: /WalletConnect logo/i,
  txBuilderLogo: /Transaction Builder logo/i,
}
const featuredAppsStr = /featured apps/i
const pinnedAppsStr = 'My pinned apps'
const pinnedAppsStrR = /my pinned apps/i

export const abi =
  '[{"inputs":[{"internalType":"address","name":"_singleton","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"stateMutability":"payable","type":"fallback"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]'

export const permissionCheckboxes = {
  camera: 'input[name="camera"]',
  addressbook: 'input[name="requestAddressBook"]',
  microphone: 'input[name="microphone"]',
  geolocation: 'input[name="geolocation"]',
  fullscreen: 'input[name="fullscreen"]',
}

export const permissionCheckboxNames = {
  camera: 'Camera',
  addressbook: 'Address Book',
  microphone: 'Microphone',
  geolocation: 'Geolocation',
  fullscreen: 'Fullscreen',
}

export const cowFallbackHandler = 'sep:0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5'

export function verifyUntrustedHandllerWarningVisible() {
  cy.get(txBuilderUntrustedFallbackAlert).should('be.visible')
}

export function verifyUntrustedHandllerWarningDoesNotExist() {
  cy.get(txBuilderUntrustedFallbackAlert).should('not.exist')
}

export function clickOnAdvancedDetails() {
  cy.get(decodedTxSummary).click({ force: true })
}

export function triggetOffChainTx() {
  cy.contains(dummyTxStr).click()
}

export function verifyBlindSigningEnabled(option) {
  if (option) {
    cy.contains(blindSigningStr).should('be.visible')
  } else {
    cy.contains(blindSigningStr).should('not.exist')
  }
}

export function clickOnBlindSigningOption() {
  cy.contains(blindSigningStr2).click()
  cy.contains(enableBlindSigningStr).click()
}

export function triggetSignMsg() {
  cy.contains(signOnchainMsgStr).click()
}

export function enterMessage(msg) {
  cy.get(appMessageInput).type(msg)
}

export function verifySignBtnDisabled() {
  cy.get('button').contains(signBtnStr).should('be.disabled')
}

export function triggetOnChainTx() {
  cy.contains(signOnchainMsgStr).click()
}

export function typeAppName(name) {
  cy.get(searchAppInput).clear().type(name)
}

export function clearSearchAppInput() {
  cy.get(searchAppInput).clear()
}

export function verifyLinkName(name) {
  cy.findAllByRole('link', { name }).should('have.length', 1)
}

export function clickOnApp(app) {
  cy.contains(app).click()
  cy.wait(2000)
}

export function verifyNoAppsTextPresent() {
  cy.contains(noAppsStr).should('exist')
}

export function pinApp(index, app, pin = true) {
  const option = pin ? 'Pin' : 'Unpin'
  const option_ = pin ? 'Unpin' : 'Pin'
  cy.get(`[aria-label="${option} ${app}"]`).eq(index).click()
  cy.get(`[aria-label="${option_} ${app}"]`).should('exist')
}

export function clickOnBookmarkedAppsTab() {
  cy.findByText(bookmarkedAppsStr).click()
}

export function verifyAppCount(count) {
  cy.findByText(`All apps (${count})`).should('be.visible')
}

export function verifyCustomAppCount(count) {
  cy.findByText(`Custom apps (${count})`).should('be.visible')
}

export function verifyPinnedAppCount(count) {
  cy.findByText(`${pinnedAppsStr} (${count})`).should(count ? 'be.visible' : 'not.exist')
}

export function verifyAppInFeaturedList(app) {
  cy.findByText(featuredAppsStr)
    .next('ul')
    .within(() => {
      cy.findByText(app).should('exist')
    })
}

export function verifyAppInPinnedList(app) {
  cy.findByText(pinnedAppsStrR)
    .next('ul')
    .within(() => {
      cy.findByText(app).should('exist')
    })
}

export function clickOnCustomAppsTab() {
  cy.findByText(customAppsStr).click()
}

export function clickOnAddCustomApp() {
  cy.findByText(addCustomAppBtnStr).click()
}

export function typeCustomAppUrl(url) {
  cy.get(appUrlInput).clear().type(url)
}

export function verifyAppNotSupportedMsg() {
  cy.contains(appNotSupportedMsg).should('be.visible')
}

export function verifyAppTitle(title) {
  cy.findByRole('heading', { name: title }).should('exist')
}

export function acceptTC() {
  cy.findByRole('checkbox').click()
}

export function clickOnAddBtn() {
  cy.findByRole('button', { name: addBtnStr }).click()
}

export function verifyAppDescription(descr) {
  cy.findByText(descr).should('exist')
}

export function clickOnOpenSafeAppBtn() {
  cy.get(openSafeAppBtn).click()
}

export function verifyDisclaimerIsDisplayed() {
  verifyDisclaimerIsVisible()
}

function verifyDisclaimerIsVisible() {
  cy.findByRole('heading', { name: disclaimerTtle }).should('be.visible')
}

export function clickOnContinueBtn() {
  cy.get(appModal).should('exist')
  return cy.findByRole('button', { name: continueBtnStr }).click().wait(1000)
}

export function checkLocalStorage() {
  clickOnContinueBtn().should(() => {
    const storedItem = window.localStorage.getItem(constants.BROWSER_PERMISSIONS_KEY)
    expect(storedItem).to.include('"feature":"camera","status":"granted"')
    expect(storedItem).to.include('"feature":"microphone","status":"denied"')
  })
}

export function verifyCameraCheckBoxExists() {
  cy.findByRole('checkbox', { name: cameraCheckBoxStr }).should('exist')
}

export function verifyMicrofoneCheckBoxExists() {
  return cy.findByRole('checkbox', { name: microfoneCheckBoxStr }).should('exist')
}

export function verifyInfoModalAcceptance() {
  cy.waitForSelector(() => {
    return cy
      .findByRole('button', { name: continueBtnStr })
      .click()
      .wait(2000)
      .should(() => {
        const storedInfoModal = JSON.parse(
          localStorage.getItem(constants.localStorageKeys.SAFE_v2__SafeApps__infoModal),
        )
        expect(storedInfoModal[constants.networkKeys.sepolia].consentsAccepted).to.eq(true)
      })
  })
}

export function verifyPreviewWindow(str1, str2, str3) {
  cy.findByRole('heading', { name: str1 }).should('exist')
  cy.findByText(str2).should('exist')
  cy.findByText(str3).should('exist')
}

export function closePreviewWindow() {
  cy.get(closePreviewWindowBtn).click()
}

export function verifyPermissionsRequestExists() {
  cy.findByRole('heading', { name: permissionRequestStr }).should('exist')
}

export function verifyAccessToAddressBookExists() {
  cy.findByText(accessToAddressBookStr).should('exist')
}

export function clickOnAcceptBtn() {
  cy.findByRole('button', { name: acceptBtnStr }).click()
}

export function uncheckAllPermissions(element) {
  cy.wrap(element).findByText(clearAllBtnStr).click()
}

export function checkAllPermissions(element) {
  cy.wrap(element).findByText(allowAllPermissions).click()
}

export function verifyPinnedApp(name) {
  cy.get(`[aria-label="${name}"]`)
}
