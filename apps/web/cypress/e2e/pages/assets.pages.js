import * as main from './main.page'
import * as addressbook from '../pages/address_book.page'
import * as createTx from '../pages/create_tx.pages'
import { tokenSelector } from '../pages/create_tx.pages'
import { assetsSwapBtn } from '../pages/swaps.pages'
import { nftsRow } from '../pages/nfts.pages'

// Re-export common selectors from main.page.js for backward compatibility
export const tableContainer = main.tableContainer

const tokenNameLink = 'a[href*="sepolia.etherscan.io"]'
const balanceSingleRow = '[aria-labelledby="tableTitle"] > tbody tr'
const currencyDropdown = '[id="currency"]'
const currencyDropdownList = 'ul[role="listbox"]'
const currencyDropdownListSelected = 'ul[role="listbox"] li[aria-selected="true"]'
const hideAssetCheckbox = '[data-testid="hide-asset-checkbox"]'
const hiddenTokenCheckbox = 'input[type="checkbox"]'
const paginationPageList = 'ul[role="listbox"]'
export const tokenListTable = 'table[aria-labelledby="tableTitle"]'
const manageTokensButton = '[data-testid="manage-tokens-button"]'
const manageTokensMenu = '[data-testid="manage-tokens-menu"]'
const hideTokensMenuItem = '[data-testid="hide-tokens-menu-item"]'
const showAllTokensSwitch = '[data-testid="show-all-tokens-switch"]'
const hideSmallBalancesSwitch = '[data-testid="hide-small-balances-switch"]'
export const tablePaginationContainer = '[data-testid="table-pagination"]'

const hiddenTokenSaveBtn = 'span[data-track="assets: Save hide dialog"]'
const hiddenTokenCancelBtn = 'span[data-track="assets: Cancel hide dialog"]'
const hiddenTokenDeselectAllBtn = 'span[data-track="assets: Deselect all hide dialog"]'
const hiddenTokenIcon = 'svg[data-testid="VisibilityOffOutlinedIcon"]'
const currencySelector = '[data-testid="currency-selector"]'
const currencyItem = '[data-testid="currency-item"]'
const tokenAmountFld = '[data-testid="token-amount-field"]'
const tokenItem = '[data-testid="token-item"]'
const sendBtn = '[data-testid="send-button"]'

const assetNameSortBtnStr = 'Asset'
const assetBalanceSortBtnStr = 'Balance'
const sendBtnStr = 'Send'

const pageRowsDefault = '25'
const rowsPerPage10 = '10'
const tablePageRage21to28 = '21–28 of'
const rowsPerPageString = 'Rows per page:'
const pageCountString1to25 = '1–25 of'
const pageCountString1to10 = '1–10 of'
const pageCountString10to20 = '11–20 of'

// Use main.tableRow for consistency
const assetsTableRow = main.tableRow
const assetsTableAssetCell = '[data-testid="table-cell-asset"]'
const assetsTableBalanceCell = '[data-testid="table-cell-balance"]'
const assetsTableValueCell = '[data-testid="table-cell-value"]'
export const assetsTableActionsCell = '[data-testid="table-cell-actions"]'
const tokenSymbol = '[data-testid="token-symbol"]'
const tokenBalanceCell = '[data-testid="token-balance"]'

export const fiatRegex = new RegExp(`\\$?(([0-9]{1,3},)*[0-9]{1,3}(\\.[0-9]{2})?|0)`)

export function toggleShowAllTokens(shouldShow) {
  cy.get(manageTokensButton).click()

  cy.get(manageTokensMenu)
    .should('be.visible')
    .within(() => {
      cy.get(showAllTokensSwitch)
        .find('input[type="checkbox"]')
        .then(($checkbox) => {
          const isChecked = $checkbox.is(':checked')
          if (shouldShow && !isChecked) {
            cy.wrap($checkbox).click({ force: true })
          } else if (!shouldShow && isChecked) {
            cy.wrap($checkbox).click({ force: true })
          }
        })
    })

  cy.get('body').click(0, 0)
  cy.get(manageTokensMenu).should('not.exist')
}

export function toggleHideDust(shouldHide) {
  cy.get(manageTokensButton).click()

  cy.get(manageTokensMenu)
    .should('be.visible')
    .within(() => {
      cy.get(hideSmallBalancesSwitch)
        .find('input[type="checkbox"]')
        .then(($checkbox) => {
          const isChecked = $checkbox.is(':checked')
          if (shouldHide && !isChecked) {
            cy.wrap($checkbox).click({ force: true })
          } else if (!shouldHide && isChecked) {
            cy.wrap($checkbox).click({ force: true })
          }
        })
    })

  cy.get('body').click(0, 0)
  cy.get(manageTokensMenu).should('not.exist')
}
export const currencyEUR = '€'
export const currencyOptionEUR = 'EUR'
export const currency$ = '$'
export const currencyCAD = 'CAD'

export const currencyAave = 'AAVE'
export const currencyAaveAlttext = 'AAVE'
export const currencyAaveBalance = '27'

export const currencyTestTokenA = 'TestTokenA'
export const currencyTestTokenAAlttext = 'TT_A'
export const currencyTestTokenABalance = '15'

export const currencyTestTokenB = 'TestTokenB'
export const currencyTestTokenBAlttext = 'TT_B'
export const currencyTestTokenBBalance = '21'

export const currencyUSDC = 'USDC'
export const currencyTestUSDCAlttext = 'USDC'
export const currencyUSDCBalance = '73'

export const currencyLink = 'LINK'
export const currencyLinkAlttext = 'LINK'
export const currencyLinkBalance = '35.94'

export const currencyDai = 'Dai'
export const currencyDaiCap = 'DAI'
export const currencyDaiAlttext = 'DAI'
export const currencyDaiBalance = '82'

export function checkNftAddressFormat() {
  cy.get(nftsRow).each(($el) => {
    cy.wrap($el)
      .invoke('text')
      .should('match', /0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/)
  })
}

export function checkNftCopyIconAndLink() {
  cy.get(nftsRow).each(($el) => {
    cy.wrap($el).within(() => {
      cy.get(createTx.copyIcon, { timeout: 5000 }).should('exist')
    })
    cy.wrap($el).within(() => {
      cy.get(createTx.explorerBtn, { timeout: 5000 }).should('exist')
    })
  })
}

export function showSendBtn(index = 0) {
  return cy.get(sendBtn).eq(index).invoke('css', 'opacity', '1').should('have.css', 'opacity', '1')
}

export function showSwapBtn() {
  return cy.get(assetsSwapBtn).invoke('css', 'opacity', '1').should('have.css', 'opacity', '1')
}

export function enterAmount(amount) {
  cy.get(tokenAmountFld).find('input').clear().type(amount)
}

export function checkSelectedToken(token) {
  cy.get(tokenSelector).contains(token)
}

function clickOnTokenSelector(index) {
  cy.get(tokenSelector).eq(index).click()
}

export function selectToken(index, token) {
  clickOnTokenSelector(index)
  cy.get(tokenItem).contains(token).click()
}

function clickOnCurrencySelector() {
  cy.get(currencySelector).click()
}

export function changeCurrency(currency) {
  clickOnCurrencySelector()
  cy.get(currencyItem).contains(currency).click()
}

export function clickOnSendBtn(index) {
  cy.wait(4000)
  cy.get(main.tableRow)
    .eq(index)
    .within(() => {
      cy.get('button')
        .contains(sendBtnStr)
        .then((elements) => {
          cy.wrap(elements[0]).invoke('css', 'opacity', 100).click()
        })
    })
}

export function clickOnSendBtnAssetsTable(index) {
  cy.get(balanceSingleRow)
    .eq(index)
    .find(assetsTableActionsCell)
    .within(() => {
      cy.get(sendBtn).should('be.visible').click()
    })
}

export function VerifySendButtonIsDisabled() {
  cy.get(sendBtn).first().should('be.disabled')
}

export function verifyTableRows(assetsLength) {
  cy.get(balanceSingleRow).should('have.length', assetsLength)
}

export function clickOnTokenNameSortBtn() {
  cy.get('span').contains(assetNameSortBtnStr).click()
  cy.wait(500)
}

export function clickOnTokenBalanceSortBtn() {
  cy.get('span').contains(assetBalanceSortBtnStr).click()
  cy.wait(500)
}

export function verifyTokenNamesOrder(option = 'ascending') {
  const tokens = []

  main.getTextToArray(assetsTableRow, tokens)

  cy.wrap(tokens).then((arr) => {
    cy.log('*** Original array ' + tokens)
    let sortedNames = [...arr].sort()
    cy.log('*** Sorted array ' + sortedNames)
    if (option == 'descending') sortedNames = [...arr].sort().reverse()
    expect(arr).to.deep.equal(sortedNames)
  })
}

export function verifyTokenBalanceOrder(option = 'ascending') {
  const balances = []

  main.extractDigitsToArray(`${assetsTableRow} ${assetsTableBalanceCell} span`, balances)

  cy.wrap(balances).then((arr) => {
    let sortedBalance = [...arr].sort()
    if (option == 'descending') sortedBalance = [...arr].sort().reverse()
    expect(arr).to.deep.equal(sortedBalance)
  })
}

export function deselecAlltHiddenTokenSelection() {
  cy.get(hiddenTokenDeselectAllBtn).click()
}

export function cancelSaveHiddenTokenSelection() {
  cy.get(hiddenTokenCancelBtn).click()
}

export function checkTokenCounter(value) {
  cy.get(hiddenTokenIcon)
    .parent()
    .within(() => {
      cy.get('p').should('include.text', value)
    })
}

export function checkHiddenTokenBtnCounter(value) {
  cy.get(manageTokensButton).click()
  cy.get(manageTokensMenu)
    .should('be.visible')
    .within(() => {
      cy.get(hideTokensMenuItem).should('include.text', `Hide tokens (${value})`)
    })
}

export function verifyEachRowHasCheckbox(state) {
  const tokens = [currencyTestTokenB, currencyTestTokenA]
  main.verifyTextVisibility(tokens)
  cy.get(tokenListTable).within(() => {
    cy.get('tbody').within(() => {
      cy.get(assetsTableRow).each(($row) => {
        if (state) {
          cy.wrap($row).find(assetsTableActionsCell).find(hiddenTokenCheckbox).should('exist').should(state)
          return
        }
        cy.wrap($row).find(assetsTableActionsCell).find(hiddenTokenCheckbox).should('exist')
      })
    })
  })
}

export function verifyTokensTabIsSelected(option) {
  cy.get(`a[aria-selected="${option}"]`).contains('Tokens')
}

export function verifyTokenIsPresent(token) {
  cy.get(tokenListTable).contains(token)
}

export function verifyTokenAltImageIsVisible(currency, alttext) {
  cy.contains(currency)
    .parents(assetsTableRow)
    .within(() => {
      cy.get(`img[alt=${alttext}]`).should('be.visible')
    })
}

export function verifyAssetNameHasExplorerLink(currency) {
  cy.get(tokenListTable)
    .contains(currency)
    .parents(assetsTableRow)
    .find(assetsTableAssetCell)
    .find(tokenNameLink)
    .should('be.visible')
    .should('have.attr', 'href')
    .and('include', 'sepolia.etherscan.io/address/')
}

export function verifyAssetExplorerLinkNotAvailable(currency) {
  cy.get(tokenListTable)
    .contains(currency)
    .parents(assetsTableRow)
    .find(assetsTableAssetCell)
    .within(() => {
      cy.get(tokenNameLink).should('not.exist')
    })
}

function getAssetRow(currency) {
  return cy.get(tokenListTable).contains(currency).parents(assetsTableRow)
}

export function verifyBalance(currency, alttext, expectedBalance, fiatRegex) {
  getAssetRow(currency).within(() => {
    cy.get(assetsTableAssetCell).find(tokenSymbol).should('contain', alttext)

    cy.get(assetsTableBalanceCell)
      .find(tokenBalanceCell)
      .should('not.be.empty')
      .invoke('text')
      .then((balanceText) => {
        const trimmedBalance = balanceText.trim()
        expect(trimmedBalance).to.match(/\d/)
        if (expectedBalance) {
          expect(trimmedBalance).to.contain(expectedBalance)
        }
      })

    if (fiatRegex) {
      cy.get(assetsTableValueCell).contains(fiatRegex)
    }
  })
}

export function verifyFirstRowDoesNotContainCurrency(currency) {
  cy.get(balanceSingleRow).first().find(assetsTableValueCell).should('not.contain', currency)
}

export function verifyFirstRowContainsCurrency(currency) {
  cy.get(balanceSingleRow).first().find(assetsTableValueCell).contains(currency)
}

export function clickOnCurrencyDropdown() {
  cy.get(currencyDropdown).click()
}

export function selectCurrency(currency) {
  cy.get(currencyDropdownList).findByText(currency).click({ force: true })
  cy.get(currencyDropdownList)
    .findByText(currency)
    .click({ force: true })
    .then(() => {
      cy.get(currencyDropdownListSelected).should('contain', currency)
    })
}

export function hideAsset(asset) {
  cy.contains(asset).parents(assetsTableRow).find(hideAssetCheckbox).click()
  cy.wait(350)
  cy.contains(asset).should('not.exist')
}

export function openHiddenTokensFromManageMenu() {
  cy.get(manageTokensButton).click()
  cy.get(hideTokensMenuItem).should('be.visible').click()
  main.verifyElementsExist([hiddenTokenSaveBtn, hiddenTokenCancelBtn, hiddenTokenDeselectAllBtn, hiddenTokenIcon])
  cy.get(hiddenTokenIcon)
    .parent()
    .within(() => {
      cy.get('p')
    })
}

export function clickOnTokenCheckbox(token) {
  cy.contains(token).parents(assetsTableRow).find(hiddenTokenCheckbox).click()
}

export function saveHiddenTokenSelection() {
  cy.get(hiddenTokenSaveBtn).click()
}

export function verifyInitialTableState() {
  cy.contains(rowsPerPageString).next().contains(pageRowsDefault)
  cy.contains(pageCountString1to25)
  cy.get(balanceSingleRow).should('have.length', 25)
}

export function changeTo10RowsPerPage() {
  cy.contains(rowsPerPageString).next().contains(pageRowsDefault).click({ force: true })
  cy.get(paginationPageList).contains(rowsPerPage10).click()
}

export function verifyTableHas10Rows() {
  cy.contains(rowsPerPageString).next().contains(rowsPerPage10)
  cy.contains(pageCountString1to10)
  cy.get(balanceSingleRow).should('have.length', 10)
}

export function navigateToNextPage() {
  cy.get(main.nextPageBtn).click({ force: true })
  cy.get(main.nextPageBtn).click({ force: true })
}

export function verifyTableHasNRows(assetsLength) {
  cy.contains(tablePageRage21to28)
  cy.get(balanceSingleRow).should('have.length', assetsLength)
}

export function navigateToPreviousPage() {
  cy.get(main.previousPageBtn).click({ force: true })
}

export function verifyTableHas10RowsAgain() {
  cy.contains(pageCountString10to20)
  cy.get(balanceSingleRow).should('have.length', 10)
}
