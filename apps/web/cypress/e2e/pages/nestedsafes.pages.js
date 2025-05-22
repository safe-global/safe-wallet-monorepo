import { setMaxAmount } from '../pages/create_tx.pages.js'
import { cardContent } from '../pages/modals.page.js'
import { addToBatchBtn } from '../pages/create_tx.pages.js'

const addNestedSafeBtn = '[data-testid="add-nested-safe-button"]'
const nestedSafeNameInput = '[data-testid="nested-safe-name-input"]'
const nextBtn = '[data-testid="next-button"]'
const fundAssetBtn = '[data-testid="fund-asset-button"]'
const assetData = '[data-testid="asset-data"]'
const amountInput = '[data-testid="amount-input"]'
const assetsInput = (index) => `input[name="assets.${index}.amount"]`
const tokenSelector = '[data-testid="token-selector"]'
const tokenItem = '[data-testid="token-item"]'
const removeAssetIcon = '[data-testid="remove-asset-icon"]'
const advancedDetailsSummary = '[data-testid="decoded-tx-summary"]'

export const fundAssetsActions = ['SafeProxyFactory 1.4.1: createProxyWithNonce', 'native transfer']
export const nonfundAssetsActions = ['createProxyWithNonce', 'SafeProxyFactory 1.4.1']

export function clickOnAdvancedDetails() {
  cy.get(advancedDetailsSummary).click()
}

export function checkAddTobatchBtnStatus(option) {
  cy.get(addToBatchBtn)
    .find('button')
    .should(option === 'be.disabled' ? 'have.attr' : 'not.have.attr', 'disabled')
}

export function actionsExist(actions) {
  actions.forEach((action) => {
    cy.get(cardContent).contains(action).should('exist')
  })
}

export function getAssetCount() {
  return cy.get(assetData).its('length')
}

export function removeAsset(index) {
  cy.get(removeAssetIcon).eq(index).click()
}

export function selectToken(index, token) {
  cy.get(tokenSelector).eq(index).click()
  cy.get('li').contains(token).click()
}

export function getTokenList(index) {
  cy.get(tokenSelector).eq(index).click()
  return cy
    .get(tokenSelector)
    .eq(index)
    .find(tokenItem)
    .find('p:first')
    .then(($tokens) => {
      return Cypress._.map($tokens, (token) => token.innerText.trim())
    })
}

export function setSendValue(index, value) {
  cy.get(assetsInput(index)).clear().type(value)
}

export function verifyMaxAmount(index, token, tokenAbbreviation) {
  cy.get(assetData)
    .eq(index)
    .within(() => {
      cy.get(assetsInput(index))
        .get('p')
        .contains(token)
        .next()
        .then((element) => {
          const maxBalance = parseFloat(element.text().replace(tokenAbbreviation, '').trim())
          cy.get(assetsInput(index)).should(($input) => {
            const actualValue = parseFloat($input.val())
            expect(actualValue).to.be.closeTo(maxBalance, 0.1)
          })
          console.log(maxBalance)
        })
    })
}

export function setMaxAmountValue(index) {
  cy.get(assetData)
    .eq(index)
    .within(() => {
      setMaxAmount()
    })
}
export function clickOnFundAssetBtn() {
  cy.get(fundAssetBtn).click()
}

export function clickOnAddNextBtn() {
  cy.get(nextBtn).click()
}

export function clickOnAddNestedSafeBtn() {
  cy.get(addNestedSafeBtn).click()
}

export function typeName(name) {
  cy.get(`${nestedSafeNameInput} input`).clear().type(name).should('have.value', name)
}

export function nameInputHasPlaceholder() {
  cy.get(`${nestedSafeNameInput} input`).should('have.attr', 'placeholder').and('not.be.empty')
}
