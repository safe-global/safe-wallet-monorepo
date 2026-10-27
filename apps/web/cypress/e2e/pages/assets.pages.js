import * as main from './main.page'

export const tokenListTable = 'table[aria-labelledby="tableTitle"]'
const currencySelector = '[data-testid="currency-selector"]'
const currencyItem = '[data-testid="currency-item"]'

export const currency$ = '$'
export const currencyCAD = 'CAD'

export function changeCurrency(currency) {
  cy.get(currencySelector).click()
  main.selectDropdownOption(currencyItem, currency)
}
