import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as wallet from '../pages/create_wallet.pages'

export const delegateCallWarning = '[data-testid="delegate-call-warning"]'
export const tokenSelector = '[data-testid="token-selector"]'
const amountInput = 'input[name="recipients.0.amount"]'
export const transactionItem = '[data-testid="transaction-item"]'
export const connectedWalletExecMethod = '[data-testid="connected-wallet-execution-method"]'
export const relayExecMethod = '[data-testid="relay-execution-method"]'
export const addToBatchBtn = '[data-testid="combo-submit-batching"]'
export const executeTxBtn = '[data-testid="execute-tx-btn"]'
const accordionDetails = '[data-testid="accordion-details"]'
export const copyIcon = '[data-testid="copy-btn-icon"]'
export const explorerBtn = '[data-testid="explorer-btn"]'
export const transactionSideList = '[data-testid="transaction-actions-list"]'
const expandAllBtn = '[data-testid="expande-all-btn"]'
export const txRowTitle = '[data-testid="tx-row-title"]'
const advancedDetails = '[data-testid="tx-advanced-details"]'
export const txDate = '[data-testid="tx-date"]'
export const replacementNewSigner = '[data-testid="new-owner"]'
const filterClearBtn = '[data-testid="clear-btn"]'
export const addressItem = '[data-testid="address-book-input"]'
const rejectTxBtn = '[data-testid="reject-btn"]'
const deleteTxModalBtn = '[data-testid="delete-tx-btn"]'
const simulateTxBtn = '[data-testid="simulate-btn"]'
const simulateSuccess = '[data-testid="simulation-success-msg"]'
export const continueSignBtn = '[data-testid="continue-sign-btn"]'
export const altImgDai = 'iframe[title="DAI"]'
export const altImgCow = 'iframe[title="COW"]'
const tableViewBtn = '[data-testid="table-view-btn"]'
const gridViewBtn = '[data-testid="grid-view-btn"]'
const txHexData = '[data-testid="tx-hex-data"]'
const txStack = '[data-testid="tx-stack"]'
const txOperation = '[data-testid="tx-operation"]'
const txHexDataRow = '[data-testid="tx-hexData"]'
const addrecipientBtn = '[data-testid="add-recipient-btn"]'

// Re-export for backward compatibility
export const executeStr = 'Execute'
const noLaterStr = 'No, later'
const confirmBtnStr = 'Confirm'
const expandAllBtnStr = 'Expand all'
const collapseAllBtnStr = 'Collapse all'
const noTxFoundStr = (type) => `0 ${type} transactions found`
const deleteFromQueueStr = 'Delete from the queue'

export const txStr = 'Transactions'
export const txDetailsStr = 'Transaction details'
export const settingsStr = 'Settings'
export const assetsStr = 'Assets'
export const topAssetsStr = 'Top assets'
export const getStartedStr = 'Get started'

const comboButton = '[data-testid="combo-submit-dropdown"]'
const comboButtonPopover = '[data-testid="combo-submit-popover"]'
export const comboButtonOptions = {
  sign: 'Sign',
  execute: 'Execute',
  addToBatch: 'Add to batch',
}

// Transaction details on Tx creation
export const txAccordionDetails = '[data-testid="decoded-tx-details"]'

export const txActions = {
  setFallbackHandler: 'setFallbackHandler',
}

export const advancedDetailsViewOptions = {
  table: 'table',
  grid: 'grid',
}

//tbr - will check if it should be removed ( we can cound by data-testid="tx-hexData" elements)
export function checkHashesExist(count) {
  cy.contains(txAccordionDetails)
    .next()
    .within(() => {
      main.verifyElementsCount(txHexDataRow, count)
      cy.get(txHexDataRow).each(($el) => {
        cy.wrap($el)
          .invoke('text')
          .should('match', /0x[a-fA-F0-9]{64}/)
      })
    })
}

export function getRejectButton() {
  return cy.get(rejectTxBtn)
}

export function clickOnRejectBtn() {
  getRejectButton().click()
}

export function deleteTx() {
  clickOnRejectBtn()
  // The delete choice stays disabled until the recommended nonce loads (deletability check),
  // so wait for it to become enabled — a click on the disabled button is silently ignored.
  cy.get(wallet.choiceBtn).contains(deleteFromQueueStr).closest(wallet.choiceBtn).should('be.enabled').click()
  cy.get(deleteTxModalBtn).click()
}

export function verifyNoTxDisplayed(type) {
  cy.get(transactionItem)
    .should('have.length', 0)
    .then(($items) => {
      main.verifyElementsCount($items, 0)
    })

  cy.contains(noTxFoundStr(type)).should('be.visible')
}

export function clickOnClearBtn() {
  cy.get(filterClearBtn).click()
}

export function verifyNumberOfTransactions(count) {
  cy.get(txDate).should('have.length.at.least', count)
  cy.get(transactionItem).should('have.length.at.least', count)
}

export function verifyCopyIconWorks(index, data) {
  cy.get(copyIcon)
    .parent()
    .eq(index)
    .trigger('click')
    .wait(1000)
    .then(() =>
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          expect(text).to.contain(data)
        })
      }),
    )
}

export function verifyNumberOfCopyIcons(number) {
  main.verifyElementsCount(copyIcon, number)
}

export function verifyNumberOfExternalLinks(number) {
  cy.get('main')
    .find(explorerBtn)
    //.parent()
    // .parent()
    // .next()
    //.children('a')
    .then(($links) => {
      expect($links.length).to.be.at.least(number)
      for (let i = 0; i < number; i++) {
        cy.wrap($links[i]).should('have.attr', 'href').and('include', constants.etherscanlLink)
      }
    })
}

export function clickOnTransactionItemByName(name, token) {
  // Keep both filters in the query chain so Cypress retries until a row contains
  // name AND token — rows render their token text slightly after they appear
  let matches = cy.get(transactionItem).filter(':contains("' + name + '")')
  if (token) {
    matches = matches.filter(':contains("' + token + '")')
  }
  matches.first().scrollIntoView().click({ force: true })
}

export function verifyExpandedDetails(data, warning) {
  main.checkTextsExistWithinElement(accordionDetails, data)
  if (warning) cy.get(warning).should('be.visible')
}

export function verifyTxHeaderDetails(data) {
  main.checkTextsExistWithinElement(transactionItem, data)
}

export function verifyAdvancedDetails(data) {
  main.checkTextsExistWithinElement(accordionDetails, data)
}

export function clickOnAdvancedDetails() {
  cy.get(advancedDetails).click()
  //({ force: true })
}

//The whole block inside Transaction details accordion: data-root and advanced details together
export function verifytxAccordionDetails(data) {
  main.checkTextsExistWithinElement(txAccordionDetails, data)
}
export function switchView(view) {
  if (view === advancedDetailsViewOptions.table) {
    cy.get(tableViewBtn).click()
    cy.get(txHexData).should('be.visible')
  } else {
    cy.get(gridViewBtn).click()
    cy.get(txOperation).should('be.visible')
  }
}

export function clickOnCopyDataBtn(expectedData) {
  cy.window().then((win) => {
    cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWrite')
  })

  cy.get(txStack).find('button').click()
  cy.get('@clipboardWrite').should('have.been.calledWith', expectedData)
}

export function switchToGridView() {
  cy.get(gridViewBtn).click()
}

export function clickOnExpandAllActionsBtn() {
  cy.get(expandAllBtn).click()
}

export function verifyTransactionActionsVisibility(option) {
  cy.get(transactionSideList).should(option)
}

export function verifyMaxAmount(token, tokenAbbreviation) {
  cy.get(tokenSelector)
    .find('[data-testid="token-item"]')
    .first()
    .contains(token)
    .next()
    .then((element) => {
      const maxBalance = parseFloat(element.text().replace(tokenAbbreviation, '').trim())
      cy.get(amountInput).should(($input) => {
        const actualValue = parseFloat($input.val())
        expect(actualValue).to.be.closeTo(maxBalance, 0.1)
      })
    })
}

export function clickOnNextBtn() {
  cy.contains(main.nextBtnStr).click()
}

export function verifyAddToBatchBtnIsEnabled() {
  return cy.get(addToBatchBtn).should('not.be.disabled')
}

export function clickOnNoLaterOption() {
  cy.contains(noLaterStr).click()
}

export function clickOnContinueSignTransactionBtn() {
  cy.get(continueSignBtn).click()
}

export function clickOnConfirmTransactionBtn() {
  cy.get('button').contains(confirmBtnStr).click()
}

export function verifyConfirmTransactionBtnIsVisible() {
  cy.get('button').contains(confirmBtnStr).should('be.visible')
}

export function clickOnExecuteBtn(index) {
  cy.get(transactionItem, { timeout: 30000 }).eq(index).find(executeTxBtn).should('be.enabled').click()
}

export function verifyDateExists(date) {
  cy.contains('div', date).should('exist')
}

export function verifyImageAltTxt(index, text) {
  cy.get('img').eq(index).should('have.attr', 'alt', text).should('be.visible')
}

export function verifyStatus(status) {
  cy.contains('div', status).should('exist')
}

export function verifyTransactionStrNotVible(str) {
  cy.contains(str).should('not.be.visible')
}

export function clickOnExpandAllBtn() {
  cy.contains(expandAllBtnStr).click()
}

export function clickOnCollapseAllBtn() {
  cy.contains(collapseAllBtnStr).click()
}

export function verifyTxDestinationAddress(receivedAddress) {
  cy.get(receivedAddress).then((address) => {
    cy.contains(address).should('exist')
  })
}

export function verifyReplacedSigner(newSignerName) {
  cy.get(replacementNewSigner).should('exist').contains(newSignerName)
}

export function clickOnSimulateTxBtn() {
  cy.get(simulateTxBtn).click()
}

export function verifySuccessfulSimulation() {
  cy.get(simulateSuccess).should('exist')
}

export function clickOnAddRecipientBtn() {
  cy.get(addrecipientBtn).click()
}

export function selectComboButtonOption(option) {
  cy.get(comboButton).click()
  cy.get(comboButtonPopover).findByText(comboButtonOptions[option]).click()
}

//Functions for the happy path flow
