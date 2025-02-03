import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as wallet from '../pages/create_wallet.pages'
import * as modal from '../pages/modals.page'

export const delegateCallWarning = '[data-testid="delegate-call-warning"]'
export const policyChangeWarning = '[data-testid="threshold-warning"]'
const newTransactionBtnStr = 'New transaction'
const recepientInput = 'input[name="recipient"]'
const tokenAddressInput = 'input[name="tokenAddress"]'
const amountInput = 'input[name="amount"]'
const nonceInput = 'input[name="nonce"]'
const gasLimitInput = '[name="gasLimit"]'
const rotateLeftIcon = '[data-testid="RotateLeftIcon"]'
export const transactionItem = '[data-testid="transaction-item"]'
export const connectedWalletExecMethod = '[data-testid="connected-wallet-execution-method"]'
export const relayExecMethod = '[data-testid="relay-execution-method"]'
export const payNowExecMethod = '[data-testid="pay-now-execution-method"]'
const addToBatchBtn = '[data-track="batching: Add to batch"]'
const accordionDetails = '[data-testid="accordion-details"]'
const copyIcon = '[data-testid="copy-btn-icon"]'
const transactionSideList = '[data-testid="transaction-actions-list"]'
const confirmationVisibilityBtn = '[data-testid="confirmation-visibility-btn"]'
const expandAllBtn = '[data-testid="expande-all-btn"]'
const collapseAllBtn = '[data-testid="collapse-all-btn"]'
export const txRowTitle = '[data-testid="tx-row-title"]'
const advancedDetails = '[data-testid="tx-advanced-details"]'
const baseGas = '[data-testid="tx-bas-gas"]'
const requiredConfirmation = '[data-testid="required-confirmations"]'
export const txDate = '[data-testid="tx-date"]'
export const proposalStatus = '[data-testid="proposal-status"]'
export const txSigner = '[data-testid="signer"]'
const spamTokenWarningIcon = '[data-testid="warning"]'
const untrustedTokenWarningModal = '[data-testid="untrusted-token-warning"]'
const sendTokensBtn = '[data-testid="send-tokens-btn"]'
export const replacementNewSigner = '[data-testid="new-owner"]'
export const messageItem = '[data-testid="message-item"]'
const filterStartDateInput = '[data-testid="start-date"]'
const filterEndDateInput = '[data-testid="end-date"]'
const filterAmountInput = '[data-testid="amount-input"]'
const filterTokenInput = '[data-testid="token-input"]'
const filterNonceInput = '[data-testid="nonce-input"]'
const filterApplyBtn = '[data-testid="apply-btn"]'
const filterClearBtn = '[data-testid="clear-btn"]'
export const addressItem = '[data-testid="address-item"]'
const radioSelector = 'div[role="radiogroup"]'
const rejectTxBtn = '[data-testid="reject-btn"]'
const deleteTxModalBtn = '[data-testid="delete-tx-btn"]'
const toggleUntrustedBtn = '[data-testid="toggle-untrusted"]'
const simulateTxBtn = '[data-testid="simulate-btn"]'
const simulateSuccess = '[data-testid="simulation-success-msg"]'
const signBtn = '[data-testid="sign-btn"]'
export const altImgDai = 'img[alt="DAI"]'
export const altImgCow = 'img[alt="COW"]'
export const altImgSwaps = 'svg[alt="Swap order"]'
export const txShareBlock = '[data-testid="share-block"]'
export const txShareBlockDetails = '[data-testid="share-block-details"]'
const copyLinkBtn = '[data-testid="copy-link-btn"]'

const viewTransactionBtn = 'View transaction'
const transactionDetailsTitle = 'Transaction details'
const QueueLabel = 'needs to be executed first'
const TransactionSummary = 'Send '
const transactionsPerHrStr = 'free transactions left today'

const maxAmountBtnStr = 'Max'
const nextBtnStr = 'Next'
const nativeTokenTransferStr = 'ETH'
const yesStr = 'Yes, '
const estimatedFeeStr = 'Estimated fee'
export const executeStr = 'Execute'
const editBtnStr = 'Edit'
const executionParamsStr = 'Execution parameters'
const noLaterStr = 'No, later'
const confirmBtnStr = 'Confirm'
const expandAllBtnStr = 'Expand all'
const collapseAllBtnStr = 'Collapse all'
export const messageNestedStr = `"nestedString": "Test message 3 off-chain"`
const noTxFoundStr = (type) => `0 ${type} transactions found`
const deleteFromQueueStr = 'Delete from the queue'
const bulkExecuteBtn = (tx) => `Bulk execute ${tx} transactions`
const bulkConfirmationText = (tx) =>
  `This transaction batches a total of ${tx} transactions from your queue into a single Ethereum transaction`

const disabledBultExecuteBtnTooltip =
  'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe Account nonce'
const enabledBulkExecuteBtnTooltip = 'All highlighted transactions will be included in the batch execution'

const bulkExecuteBtnStr = 'Bulk execute'

const batchModalTitle = 'Batch'
export const swapOrder = 'Swap order settlement'
export const bulkTxs = 'Bulk transactions'

export const filterTypes = {
  incoming: 'Incoming',
  outgoing: 'Outgoing',
  module: 'Module-based',
}
export function clickOnCopyLinkBtn() {
  cy.get(copyLinkBtn).click()
}

export function verifyCopiedURL() {
  cy.window().then((win) => {
    cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWrite')
  })

  cy.url().then((currentUrl) => {
    clickOnCopyLinkBtn()

    cy.get('@clipboardWrite').should('have.been.calledWith', currentUrl)
  })
}

export function expandTxShareBlock() {
  cy.get(txShareBlock).click()
  cy.get(txShareBlockDetails).should('be.visible')
}

function clickOnRejectBtn() {
  cy.get(rejectTxBtn).click()
}

export function verifyBulkExecuteBtnIsEnabled(txs) {
  return cy.get('button').contains(bulkExecuteBtn(txs)).should('be.enabled')
}

export function verifyEnabledBulkExecuteBtnTooltip() {
  cy.get('button').contains(bulkExecuteBtnStr).trigger('mouseover', { force: true })
  cy.contains(enabledBulkExecuteBtnTooltip).should('exist')
}

export function deleteTx() {
  clickOnRejectBtn()
  cy.get(wallet.choiceBtn).contains(deleteFromQueueStr).click()
  cy.get(deleteTxModalBtn).click()
}

export function deleteAllTx() {
  cy.get('body').then(($body) => {
    if ($body.find(transactionItem).length > 0) {
      cy.get(transactionItem).then(($items) => {
        for (let i = $items.length - 1; i >= 0; i--) {
          cy.wrap($items[i]).click({ force: true })
          deleteTx()
        }
      })
    }
  })
}

export function setTxType(type) {
  cy.get(radioSelector).find('label').contains(type).click()
}

export function verifyNoTxDisplayed(type) {
  cy.get(transactionItem)
    .should('have.length', 0)
    .then(($items) => {
      main.verifyElementsCount($items, 0)
    })

  cy.contains(noTxFoundStr(type)).should('be.visible')
}

export function clickOnApplyBtn() {
  cy.get(filterApplyBtn).click()
}

export function checkApplyBtnEnabled() {
  cy.get(filterApplyBtn).should('not.be', 'disabled')
}

export function clickOnClearBtn() {
  cy.get(filterClearBtn).click()
}

export function fillFilterForm({ address, startDate, endDate, amount, token, nonce, recipient } = {}) {
  checkApplyBtnEnabled()
  cy.wait(2000)
  const inputMap = {
    address: { selector: addressItem, findInput: true },
    startDate: { selector: filterStartDateInput, findInput: true },
    endDate: { selector: filterEndDateInput, findInput: true },
    amount: { selector: filterAmountInput, findInput: true },
    token: { selector: filterTokenInput, findInput: true },
    nonce: { selector: filterNonceInput, findInput: true },
    recipient: { selector: addressItem, findInput: true },
  }

  Object.entries({ address, startDate, endDate, amount, token, nonce, recipient }).forEach(([key, value]) => {
    if (value !== undefined) {
      const { selector, findInput } = inputMap[key]
      const element = findInput ? cy.get(selector).find('input') : cy.get(selector)
      element.then(($el) => {
        cy.wrap($el).invoke('removeAttr', 'readonly').clear().type(value, { force: true })
      })
    }
  })
}

export function clickOnFilterBtn() {
  cy.get('button').then((buttons) => {
    const filterButton = [...buttons].find((button) => {
      return ['Filter', 'Incoming', 'Outgoing', 'Module-based'].includes(button.innerText)
    })

    if (filterButton) {
      cy.wrap(filterButton).click()
    } else {
      throw new Error('No filter button found')
    }
  })
}

export function checkTxItemDate(index, date) {
  cy.get(txDate).eq(index).should('contain', date)
}

export function clickOnSendTokensBtn() {
  cy.get(sendTokensBtn).click()
}
export function verifyNumberOfTransactions(count) {
  cy.get(txDate).should('have.length.at.least', count)
  cy.get(transactionItem).should('have.length.at.least', count)
}

export function checkRequiredThreshold(count) {
  cy.get(requiredConfirmation).should('be.visible').and('include.text', count)
}

export function verifyAddressNotCopied(index, data) {
  cy.get(copyIcon)
    .parent()
    .eq(index)
    .trigger('click')
    .wait(1000)
    .then(() =>
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          expect(text).not.to.contain(data)
        })
      }),
    )
  cy.get(untrustedTokenWarningModal).should('be.visible')
}

export function verifyWarningModalVisible() {
  cy.get(untrustedTokenWarningModal).should('be.visible')
}

export function clickOnCopyBtn(index) {
  cy.get(copyIcon).parent().eq(index).trigger('click')
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
  cy.get(copyIcon)
    .parent()
    .parent()
    .next()
    .children('a')
    .then(($links) => {
      expect($links.length).to.be.at.least(number)
      for (let i = 0; i < number; i++) {
        cy.wrap($links[i]).should('have.attr', 'href').and('include', constants.etherscanlLink)
      }
    })
}

export function clickOnTransactionItemByName(name, token) {
  cy.get(transactionItem)
    .filter(':contains("' + name + '")')
    .then(($elements) => {
      if (token) {
        $elements = $elements.filter(':contains("' + token + '")')
      }
      cy.wrap($elements.first()).click({ force: true })
    })
}

export function clickOnTransactionItemByIndex(index) {
  cy.get(messageItem)
    .eq(index)
    .then(($elements) => {
      cy.wrap($elements).click({ force: true })
    })
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

export function verifyActions(data) {
  main.checkTextsExistWithinElement(accordionDetails, data)
}

export function clickOnExpandableAction(data) {
  cy.get(accordionDetails).within(() => {
    cy.get('div').contains(data).click()
  })
}

export function clickOnAdvancedDetails() {
  cy.get(advancedDetails).click()
}

export function expandAdvancedDetails(data) {
  clickOnAdvancedDetails()
  data.forEach((row) => {
    cy.get(txRowTitle).contains(row).should('be.visible')
  })
}

export function collapseAdvancedDetails() {
  clickOnAdvancedDetails()
  cy.get(baseGas).should('not.exist')
}

export function expandAllActions(actions) {
  cy.get(expandAllBtn).click()
  main.checkTextsExistWithinElement(accordionDetails, actions)
}

export function clickOnExpandAllActionsBtn() {
  cy.get(expandAllBtn).click()
}

export function collapseAllActions(data) {
  cy.get(collapseAllBtn).click()
  data.forEach((action) => {
    cy.get(txRowTitle).contains(action).should('have.css', 'visibility', 'hidden')
  })
}

export function verifyActionListExists(data) {
  main.checkTextsExistWithinElement(transactionSideList, data)
  main.verifyElementsIsVisible([confirmationVisibilityBtn])
}

export function verifySpamIconIsDisplayed(name, token) {
  cy.get(transactionItem)
    .filter(':contains("' + name + '")')
    .filter(':contains("' + token + '")')
    .then(($elements) => {
      cy.wrap($elements.first()).then(($element) => {
        cy.wrap($element).find(spamTokenWarningIcon).should('be.visible')
      })
    })
}

export function verifySummaryByName(name, token, data, alt, altToken) {
  if (!name) {
    throw new Error('Name parameter is required for verification')
  }

  let selector = `${transactionItem}:contains("${name}")`
  if (token) {
    selector += `:contains("${token}")`
  }

  cy.get(selector).then(($elements) => {
    expect($elements.length, `Transaction items found for name: ${name}`).to.be.greaterThan(0)

    const $element = $elements.first()

    if (Array.isArray(data)) {
      data.forEach((text) => {
        expect($element.text()).to.include(text)
      })
    } else if (data) {
      expect($element.text()).to.include(data)
    }

    if (alt) {
      const firstImg = $element.find('img')
      const firstSvg = $element.find('svg')

      if (firstImg.length > 0) {
        const targetImg = firstImg.first()
        expect(targetImg.attr('alt')).to.equal(alt)
      } else if (firstSvg.length > 0) {
        const targetSvg = firstSvg.first()
        expect(targetSvg.attr('alt')).to.equal(alt)
      }
    }

    if (altToken) {
      const secondImg = $element.find('img').eq(1)
      expect(secondImg.attr('alt')).to.equal(altToken)
    }
  })
}
export function verifySummaryByIndex(index, data, alt) {
  cy.get(messageItem)
    .eq(index)
    .then(($elements) => {
      cy.wrap($elements).then(($element) => {
        if (Array.isArray(data)) {
          data.forEach((text) => {
            cy.wrap($element).contains(text).should('be.visible')
          })
        } else {
          cy.wrap($element).contains(data).should('be.visible')
        }
        if (alt) cy.wrap($element).find('img').eq(0).should('have.attr', 'alt', alt).should('be.visible')
      })
    })
}

export function clickOnTransactionItem(item) {
  cy.get(transactionItem).eq(item).scrollIntoView().click({ force: true })
}

export function verifyTransactionActionsVisibility(option) {
  cy.get(transactionSideList).should(option)
}

export function clickOnNewtransactionBtn() {
  // Assert that "New transaction" button is visible
  cy.contains(newTransactionBtnStr, {
    timeout: 60_000, // `lastWallet` takes a while initialize in CI
  })
    .should('be.visible')
    .and('not.be.disabled')

  // Open the new transaction modal
  cy.contains(newTransactionBtnStr).click()
  cy.contains('h1', newTransactionBtnStr).should('be.visible')
}

export function typeRecipientAddress(address) {
  cy.get(recepientInput).clear().type(address).should('have.value', address)
}
export function verifyENSResolves(fullAddress) {
  let split = fullAddress.split(':')
  let noPrefixAddress = split[1]
  cy.get(recepientInput).should('have.value', noPrefixAddress)
}

export function verifyRandomStringAddress(randomAddressString) {
  typeRecipientAddress(randomAddressString)
  cy.contains(constants.addressBookErrrMsg.invalidFormat).should('be.visible')
}

export function verifyWrongChecksum(wronglyChecksummedAddress) {
  typeRecipientAddress(wronglyChecksummedAddress)
  cy.contains(constants.addressBookErrrMsg.invalidChecksum).should('be.visible')
}

export function verifyAmountLargerThanCurrentBalance() {
  setSendValue(9999)
  cy.contains(constants.amountErrorMsg.largerThanCurrentBalance).should('be.visible')
}

export function verifyTooltipMessage(message) {
  cy.get('div[role="tooltip"]').contains(message).should('be.visible')
}

export function selectCurrentWallet() {
  cy.get(connectedWalletExecMethod).click()
}

export function verifyRelayerAttemptsAvailable() {
  cy.contains(transactionsPerHrStr).should('be.visible')
}

export function clickOnTokenselectorAndSelectSepoliaEth() {
  cy.get(tokenAddressInput).prev().click()
  cy.get('ul[role="listbox"]').contains(constants.tokenNames.sepoliaEther).click()
}

export function setMaxAmount() {
  cy.contains(maxAmountBtnStr).click()
}

export function verifyMaxAmount(token, tokenAbbreviation) {
  cy.get(tokenAddressInput)
    .prev()
    .find('p')
    .contains(token)
    .next()
    .then((element) => {
      const maxBalance = parseFloat(element.text().replace(tokenAbbreviation, '').trim())
      cy.get(amountInput).should(($input) => {
        const actualValue = parseFloat($input.val())
        expect(actualValue).to.be.closeTo(maxBalance, 0.1)
      })
      console.log(maxBalance)
    })
}

export function setSendValue(value) {
  cy.get(amountInput).clear().type(value)
}

export function clickOnNextBtn() {
  cy.contains(nextBtnStr).click()
}

export function verifySubmitBtnIsEnabled() {
  cy.get('button[type="submit"]').should('not.be.disabled')
}

export function verifyAddToBatchBtnIsEnabled() {
  return cy.get(addToBatchBtn).should('not.be.disabled')
}

export function verifyNativeTokenTransfer() {
  cy.contains(nativeTokenTransferStr).should('be.visible')
}

export function changeNonce(value) {
  cy.get(nonceInput).clear().type(value, { force: true })
}

export function verifyConfirmTransactionData() {
  cy.contains(yesStr).should('exist').click()
  cy.contains(estimatedFeeStr).should('exist')

  // Asserting the sponsored info is present
  cy.contains(executeStr).scrollIntoView().should('be.visible')

  cy.get('span').contains(estimatedFeeStr)
}

export function openExecutionParamsModal() {
  cy.contains(estimatedFeeStr).click()
  cy.contains(editBtnStr).click()
}

export function verifyAndSubmitExecutionParams() {
  cy.contains(executionParamsStr).parents('form').as('Paramsform')
  const arrayNames = ['Wallet nonce', 'Max priority fee (Gwei)', 'Max fee (Gwei)', 'Gas limit']
  arrayNames.forEach((element) => {
    cy.get('@Paramsform').find('label').contains(`${element}`).next().find('input').should('not.be.disabled')
  })

  cy.get('@Paramsform').find(gasLimitInput).clear().type('100').invoke('prop', 'value').should('equal', '100')
  cy.contains('Gas limit must be at least 21000').should('be.visible')
  cy.get('@Paramsform').find(gasLimitInput).clear().type('300000').invoke('prop', 'value').should('equal', '300000')
  cy.get('@Paramsform').find(gasLimitInput).parent('div').find(rotateLeftIcon).click()
  cy.get('@Paramsform').submit()
}

export function clickOnNoLaterOption() {
  cy.contains(noLaterStr).click()
}

export function clickOnSignTransactionBtn() {
  cy.get(signBtn).click()
}

export function clickOnConfirmTransactionBtn() {
  cy.get('button').contains(confirmBtnStr).click()
}

export function verifyConfirmTransactionBtnIsVisible() {
  cy.get('button').contains(confirmBtnStr).should('be.visible')
}

export function waitForProposeRequest() {
  cy.intercept('POST', constants.proposeEndpoint).as('ProposeTx')
  cy.wait('@ProposeTx')
}

export function clickViewTransaction() {
  cy.contains(viewTransactionBtn).click()
}

export function verifySingleTxPage() {
  cy.get('h3').contains(transactionDetailsTitle).should('be.visible')
}

export function verifyQueueLabel() {
  cy.contains(QueueLabel).should('be.visible')
}

export function verifyTransactionSummary(sendValue) {
  cy.contains(TransactionSummary + `${sendValue} ${constants.tokenAbbreviation.sep}`).should('exist')
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

export function verifyTransactionStrExists(str) {
  cy.contains(str).should('exist')
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

function verifyBulkActions(actions) {
  actions.forEach((action) => {
    cy.contains(action).should('exist')
  })
}

export function verifyBulkConfirmationScreen(tx, actions) {
  cy.contains(bulkConfirmationText(tx))
  verifyBulkActions(actions)
  cy.get(modal.modalHeader).within(() => {
    cy.contains(batchModalTitle).should('exist')
    cy.get('svg').should('exist')
  })
}

export function verifyBulkTxHistoryBlock(order, tx, actions) {
  cy.contains(order)
    .parent('div')
    .parent()
    .eq(0)
    .within(() => {
      cy.contains(tx)
      verifyBulkActions(actions)
    })
}

export function verifyBulkExecuteBtnIsDisabled() {
  cy.get('button').contains(bulkExecuteBtnStr).should('be.disabled')
  cy.get('button').contains(bulkExecuteBtnStr).trigger('mouseover', { force: true })
  cy.contains(disabledBultExecuteBtnTooltip).should('exist')
}

export function toggleUntrustedTxs() {
  cy.get(toggleUntrustedBtn).click()
}

export function clickOnSimulateTxBtn() {
  cy.get(simulateTxBtn).click()
}

export function verifySuccessfulSimulation() {
  cy.get(simulateSuccess).should('exist')
}
