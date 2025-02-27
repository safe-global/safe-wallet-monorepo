import * as main from './main.page'
import * as addressbook from '../pages/address_book.page'
import * as createTx from '../pages/create_tx.pages'
import { tableRow } from '../pages/address_book.page'
import { assetsSwapBtn } from '../pages/swaps.pages'
import { nftsRow } from '../pages/nfts.pages'


let etherscanLinkSepolia = 'a[aria-label="View on sepolia.etherscan.io"]'
export const balanceSingleRow = '[aria-labelledby="tableTitle"] > tbody tr'
const currencyDropdown = '[id="currency"]'
const currencyDropdownList = 'ul[role="listbox"]'
const currencyDropdownListSelected = 'ul[role="listbox"] li[aria-selected="true"]'
const hideAssetBtn = 'button[aria-label="Hide asset"]'
const hiddeTokensBtn = '[data-testid="toggle-hidden-assets"]'
const hiddenTokenCheckbox = 'input[type="checkbox"]'
const paginationPageList = 'ul[role="listbox"]'
const currencyDropDown = 'div[id="currency"]'
export const tokenListTable = 'table[aria-labelledby="tableTitle"]'
const tokenListDropdown = 'div[id="tokenlist-select"]'
export const tablePaginationContainer = '[data-testid="table-pagination"]'

const hiddenTokenSaveBtn = 'span[data-track="assets: Save hide dialog"]'
const hiddenTokenCancelBtn = 'span[data-track="assets: Cancel hide dialog"]'
const hiddenTokenDeselectAllBtn = 'span[data-track="assets: Deselect all hide dialog"]'
const hiddenTokenIcon = 'svg[data-testid="VisibilityOffOutlinedIcon"]'
const currencySelector = '[data-testid="currency-selector"]'
const currencyItem = '[data-testid="currency-item"]'
const tokenAmountFld = '[data-testid="token-amount-field"]'
const tokenBalance = '[data-testid="token-balance"]'
const tokenItem = '[data-testid="token-item"]'
const sendBtn = '[data-testid="send-button"]'

const hideTokenDefaultString = 'Hide tokens'
const assetNameSortBtnStr = 'Asset'
const assetBalanceSortBtnStr = 'Balance'
export const sendBtnStr = 'Send'
export const confirmBtnStr = 'Confirm'
export const executeBtnStr = 'Execute'
const sendTokensStr = 'Send tokens'

const pageRowsDefault = '25'
const rowsPerPage10 = '10'
const nextPageBtn = 'button[aria-label="Go to next page"]'
const previousPageBtn = 'button[aria-label="Go to previous page"]'
const tablePageRage21to28 = '21–28 of'
const rowsPerPageString = 'Rows per page:'
const pageCountString1to25 = '1–25 of'
const pageCountString1to10 = '1–10 of'
const pageCountString10to20 = '11–20 of'

export const fiatRegex = new RegExp(`\\$?(([0-9]{1,3},)*[0-9]{1,3}(\\.[0-9]{2})?|0)`)

export const tokenListOptions = {
  allTokens: 'span[data-track="assets: Show all tokens"]',
  default: 'span[data-track="assets: Show default tokens"]',
}
export const currencyEUR = '€'
export const currencyOptionEUR = 'EUR'
export const currency$ = '$'
export const currencyCAD = 'CAD'

export const currentcySepoliaFormat = '0.09996 ETH'

export const currencyTestTokenTTONE = 'test-token-type-one'
export const currencyTestTokenTTONEAlttext = 'TTONE'
export const currentcyTestTokenTTONEFormat = '90 TTONE'
export const currentcyTestTokenTTONEFormat_2 = '10 TTONE'
export const currentcyTestTokenTTONEFormat_3 = '5 TTONE'
export const currentcyTestTokenTTONEFormat_4 = '95 TTONE'

export const currencyAave = 'AAVE'
export const currencyAaveAlttext = 'AAVE'
export const currentcyAaveFormat = '27 AAVE'

export const currencyTestTokenA = 'TestTokenA'
export const currencyTestTokenAAlttext = 'TT_A'
export const currentcyTestTokenAFormat = '15 TT_A'

export const currencyTestTokenB = 'TestTokenB'
export const currencyTestTokenBAlttext = 'TT_B'
export const currentcyTestTokenBFormat = '21 TT_B'

export const currencyUSDC = 'USDC'
export const currencyTestUSDCAlttext = 'USDC'
export const currentcyTestUSDCFormat = '73 USDC'

export const currencyLink = 'LINK'
export const currencyLinkAlttext = 'LINK'
export const currentcyLinkFormat = '35.94 LINK'

export const currencyDai = 'Dai'
export const currencyDaiCap = 'DAI'
export const currencyDaiAlttext = 'DAI'
export const currentcyDaiFormat = '82 DAI'
export const currencyDaiFormat_2 = '82 DAI'

export const currencyEther = 'Wrapped Ether'
export const currencyEtherAlttext = 'WETH'
export const currentcyEtherFormat = '0.05918 WETH'

export const currencyUSDCoin = 'USD Coin'
export const currencyUSDAlttext = 'USDC'
export const currentcyUSDFormat = '131,363 USDC'

export const currencyGörliEther = 'Görli Ether'
export const currentcyGörliEtherFormat = '0.14 GOR'

export const currencyUniswap = 'Uniswap'
export const currentcyUniswapFormat = '0.01828 UNI'

export const currencyGnosis = 'Gnosis'
export const currentcyGnosisFormat = '< 0.00001 GNO'

export const currencyOx = /^0x$/
export const currentcyOxFormat = '1.003 ZRX'

export function checkNftAddressFormat() {
  cy.get(nftsRow).each(($el) => {
    cy.wrap($el)
      .invoke('text')
      .should('match', /0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/);
  });
}

export function checkNftCopyIconAndLink() {
  cy.get(nftsRow).each(($el) => {
    cy.wrap($el)
      .within(() => {
        cy.get(createTx.copyIcon, { timeout: 5000 })
          .should('exist');
      });
    cy.wrap($el)
      .within(() => {
        cy.get(createTx.explorerBtn, { timeout: 5000 })
          .should('exist');
      });
  });
}

export function showSendBtn() {
  return cy.get(sendBtn)
    .invoke('css', 'opacity', '1')
    .should('have.css', 'opacity', '1');
}

export function showSwapBtn() {
  return cy.get(assetsSwapBtn)
    .invoke('css', 'opacity', '1')
    .should('have.css', 'opacity', '1');
}

export function enterAmount(amount) {
  cy.get(tokenAmountFld).find('input').clear().type(amount)
}

export function checkSelectedToken(token) {
  cy.get(tokenBalance).contains(token)
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
  cy.get(addressbook.tableRow)
    .eq(index)
    .within(() => {
      cy.get('button')
        .contains(sendBtnStr)
        .then((elements) => {
          cy.wrap(elements[0]).invoke('css', 'opacity', 100).click()
        })
    })
}

export function clickOnConfirmBtn(index) {
  cy.wait(2000)
  cy.get(createTx.transactionItem)
    .eq(index)
    .within(() => {
      cy.get('button')
        .contains(confirmBtnStr)
        .then((elements) => {
          cy.wrap(elements[0]).click()
        })
    })
}

export function clickOnExecuteBtn(index) {
  cy.wait(2000)
  cy.get(createTx.transactionItem)
    .eq(index)
    .within(() => {
      cy.get('button')
        .contains(executeBtnStr)
        .then((elements) => {
          cy.wrap(elements[0]).click()
        })
    })
}


export function VerifySendButtonIsDisabled() {
  cy.get('button').contains(sendBtnStr).should('be.disabled')
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

  main.getTextToArray(tableRow, tokens)

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

  main.extractDigitsToArray('tr td:nth-child(2) span', balances)

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

export function checkNFTCounter(value) {
  cy.get(hiddenTokenIcon)
    .parent()
    .within(() => {
      cy.get('p').should('include.text', value)
    })
}

export function checkHiddenTokenBtnCounter(value) {
  cy.get(hiddeTokensBtn).within(() => {
    cy.get('p').should('include.text', value)
  })
}

export function verifyEachRowHasCheckbox(state) {
  const tokens = [currencyTestTokenB, currencyTestTokenA]
  main.verifyTextVisibility(tokens)
  cy.get(tokenListTable).within(() => {
    cy.get('tbody').within(() => {
      cy.get('tr').each(($row) => {
        if (state) {
          cy.wrap($row).find('td').eq(3).find(hiddenTokenCheckbox).should('exist').should(state)
          return
        }
        cy.wrap($row).find('td').eq(3).find(hiddenTokenCheckbox).should('exist')
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

export function selectTokenList(option) {
  cy.get(tokenListDropdown)
    .click({ force: true })
    .then(() => {
      cy.get(option).click({ force: true })
    })
}

export function verityTokenAltImageIsVisible(currency, alttext) {
  cy.contains(currency)
    .parents('tr')
    .within(() => {
      cy.get(`img[alt=${alttext}]`).should('be.visible')
    })
}

export function verifyAssetNameHasExplorerLink(currency, columnName) {
  etherscanLinkSepolia
  cy.get(tokenListTable)
    .contains(currency)
    .parents('tr')
    .find('td')
    .eq(columnName)
    .find(etherscanLinkSepolia)
    .should('be.visible')
}

export function verifyAssetExplorerLinkNotAvailable(currency, columnName) {
  cy.get(tokenListTable)
    .contains(currency)
    .parents('tr')
    .find('td')
    .eq(columnName)
    .within(() => {
      cy.get(etherscanLinkSepolia).should('not.exist')
    })
}

export function verifyBalance(currency, tokenAmountColumn, alttext) {
  cy.get(tokenListTable).contains(currency).parents('tr').find('td').eq(tokenAmountColumn).contains(alttext)
}

export function verifyTokenBalanceFormat(currency, formatString, tokenAmountColumn, fiatAmountColumn, fiatRegex) {
  cy.get(tokenListTable)
    .contains(currency)
    .parents('tr')
    .within(() => {
      cy.get('td').eq(tokenAmountColumn).contains(formatString)
      cy.get('td').eq(fiatAmountColumn).contains(fiatRegex)
    })
}

export function verifyFirstRowDoesNotContainCurrency(currency, fiatAmountColumn) {
  cy.get(balanceSingleRow).first().find('td').eq(fiatAmountColumn).should('not.contain', currency)
}

export function verifyFirstRowContainsCurrency(currency, fiatAmountColumn) {
  cy.get(balanceSingleRow).first().find('td').eq(fiatAmountColumn).contains(currency)
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
  cy.contains(asset).parents('tr').find('button[aria-label="Hide asset"]').click()
  cy.wait(350)
  cy.contains(asset).should('not.exist')
}

export function openHideTokenMenu() {
  cy.get(hiddeTokensBtn).click()
  main.verifyElementsExist([hiddenTokenSaveBtn, hiddenTokenCancelBtn, hiddenTokenDeselectAllBtn, hiddenTokenIcon])
  cy.get(hiddenTokenIcon)
    .parent()
    .within(() => {
      cy.get('p')
    })
}

export function clickOnTokenCheckbox(token) {
  cy.contains(token).parents('tr').find(hiddenTokenCheckbox).click()
}

export function saveHiddenTokenSelection() {
  cy.get(hiddenTokenSaveBtn).click()
}

export function verifyTokenIsVisible(token) {
  cy.contains(token)
}

export function verifyMenuButtonLabelIsDefault() {
  cy.contains(hideTokenDefaultString)
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
  cy.get(nextPageBtn).click({ force: true })
  cy.get(nextPageBtn).click({ force: true })
}

export function verifyTableHasNRows(assetsLength) {
  cy.contains(tablePageRage21to28)
  cy.get(balanceSingleRow).should('have.length', assetsLength)
}

export function navigateToPreviousPage() {
  cy.get(previousPageBtn).click({ force: true })
}

export function verifyTableHas10RowsAgain() {
  cy.contains(pageCountString10to20)
  cy.get(balanceSingleRow).should('have.length', 10)
}
