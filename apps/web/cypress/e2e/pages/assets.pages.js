import * as main from './main.page'

// Re-export common selectors from main.page.js for backward compatibility
export const tableContainer = main.tableContainer

export const tokenListTable = 'table[aria-labelledby="tableTitle"]'
export const assetsTableActionsCell = '[data-testid="table-cell-actions"]'
const manageTokensButton = '[data-testid="manage-tokens-button"]'
const manageTokensMenu = '[data-testid="manage-tokens-menu"]'
const showAllTokensSwitch = '[data-testid="show-all-tokens-switch"]'
const hideSmallBalancesSwitch = '[data-testid="hide-small-balances-switch"]'
const currencySelector = '[data-testid="currency-selector"]'
const currencyItem = '[data-testid="currency-item"]'

export const currency$ = '$'
export const currencyCAD = 'CAD'

// The switch is a Base UI control: the test id sits on the `role="switch"` element itself and the
// state lives in `aria-checked`. It renders a native `input[type="checkbox"]` only when given a
// `name`, and even then it is visually hidden — so read and click the switch element directly.
function setSwitchState(switchSelector, shouldBeOn) {
  cy.get(switchSelector).then(($switch) => {
    const isOn = $switch.attr('aria-checked') === 'true'
    if (isOn !== shouldBeOn) {
      // A focus-opened info tooltip can overlay the switch inside the menu, so force the click
      // and assert the resulting state instead of relying on the click landing unobstructed.
      cy.wrap($switch).click({ force: true })
    }
  })
  cy.get(switchSelector).should('have.attr', 'aria-checked', String(shouldBeOn))
}

export function toggleShowAllTokens(shouldShow) {
  cy.get(manageTokensButton).click()

  cy.get(manageTokensMenu)
    .should('be.visible')
    .within(() => {
      setSwitchState(showAllTokensSwitch, shouldShow)
    })

  cy.get('body').click(0, 0)
  cy.get(manageTokensMenu).should('not.exist')
}

export function toggleHideDust(shouldHide) {
  cy.get(manageTokensButton).click()

  cy.get(manageTokensMenu)
    .should('be.visible')
    .within(() => {
      setSwitchState(hideSmallBalancesSwitch, shouldHide)
    })

  cy.get('body').click(0, 0)
  cy.get(manageTokensMenu).should('not.exist')
}

export function changeCurrency(currency) {
  cy.get(currencySelector).click()
  main.selectDropdownOption(currencyItem, currency)
}
