import { setMaxAmount, tokenSelector } from '../pages/create_tx.pages.js'
import { cardContent } from '../pages/modals.page.js'
import { addToBatchBtn } from '../pages/create_tx.pages.js'

const addNestedSafeBtn = '[data-testid="add-nested-safe-button"]'
const nestedSafeNameInput = '[data-testid="nested-safe-name-input"]'
const nextBtn = '[data-testid="next-button"]'
const fundAssetBtn = '[data-testid="fund-asset-button"]'
const assetData = '[data-testid="asset-data"]'
const assetsInput = (index) => `input[name="assets.${index}.amount"]`
const tokenItem = '[data-testid="token-item"]'
const removeAssetIcon = '[data-testid="remove-asset-icon"]'
const advancedDetailsSummary = '[data-testid="decoded-tx-summary"]'

export const fundAssetsActions = ['SafeProxyFactory 1.4.1: createProxyWithNonce', /2\s*Send.*0\.00002\s*ETH.*to/]
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

// Nested safes curation (hide/show) functions
const manageNestedSafesBtn = '[data-testid="manage-nested-safes-button"]'
const nestedSafeList = '[data-testid="nested-safe-list"]'
const cancelManageBtn = '[data-testid="cancel-manage-nested-safes"]'
const saveManageBtn = '[data-testid="save-manage-nested-safes"]'
const safeListItem = '[data-testid="safe-list-item"]'
const reviewNestedSafesBtn = '[data-testid="review-nested-safes-button"]'
const moreNestedSafesIndicator = '[data-testid="more-nested-safes-indicator"]'
const closePopoverBtn = '[data-testid="modal-dialog-close-btn"]'

// UI text shows positive selection count (safes selected to SHOW)
export const selectedSafesText = (count) => `${count} ${count === 1 ? 'safe' : 'safes'} selected`
export const suspiciousSafeWarning = 'This Safe was not created by the parent Safe or its signers'
export const showAllNestedSafesStr = 'Show all nested Safes'

export function clickOnManageNestedSafesBtn() {
  cy.get(manageNestedSafesBtn).click()
}

export function verifyManageBtnExists() {
  cy.get(manageNestedSafesBtn).should('exist')
}

export function verifyManageBtnNotExists() {
  cy.get(manageNestedSafesBtn).should('not.exist')
}

export function clickOnCancelManageBtn() {
  cy.get(cancelManageBtn).click()
}

export function clickOnSaveManageBtn() {
  cy.get(saveManageBtn).click()
}

export function verifySaveAndCancelBtnsExist() {
  cy.get(cancelManageBtn).should('exist')
  cy.get(saveManageBtn).should('exist')
}

export function verifySaveAndCancelBtnsNotExist() {
  cy.get(cancelManageBtn).should('not.exist')
  cy.get(saveManageBtn).should('not.exist')
}

export function verifyCancelBtnNotExists() {
  cy.get(cancelManageBtn).should('not.exist')
}

export function verifySaveBtnExists() {
  cy.get(saveManageBtn).should('exist')
}

// Verify the count of selected safes shown in the manage mode header
export function verifySelectedSafesCount(count) {
  cy.contains(selectedSafesText(count)).should('exist')
}

export function verifyVisibleNestedSafesCount(count) {
  cy.get(nestedSafeList).find(safeListItem).should('have.length', count)
}

export function clickOnSafeCheckbox(address) {
  cy.get(`[data-testid="safe-item-checkbox-${address}"]`).click()
}

export function verifySafeCheckboxState(address, checked) {
  cy.get(`[data-testid="safe-item-checkbox-${address}"]`).should(checked ? 'be.checked' : 'not.be.checked')
}

// Warning icon selector for suspicious safes
const suspiciousWarningIcon = '[data-testid="suspicious-safe-warning"]'

export function verifySafeHasWarningIcon(address) {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .contains(address.substring(0, 6))
    .parents(safeListItem)
    .find(suspiciousWarningIcon)
    .should('exist')
}

export function verifySafeDoesNotHaveWarningIcon(address) {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .contains(address.substring(0, 6))
    .parents(safeListItem)
    .find(suspiciousWarningIcon)
    .should('not.exist')
}

export function verifyWarningIconCount(count) {
  if (count === 0) {
    cy.get(nestedSafeList).find(suspiciousWarningIcon).should('not.exist')
  } else {
    cy.get(nestedSafeList).find(suspiciousWarningIcon).should('have.length', count)
  }
}

export function verifySafeAddressInList(addressShort) {
  cy.get(nestedSafeList).should('contain', addressShort)
}

export function verifySafeAddressNotInList(addressShort) {
  cy.get(nestedSafeList).should('not.contain', addressShort)
}

export function clickShowAllNestedSafes() {
  cy.contains(showAllNestedSafesStr).scrollIntoView().click()
}

export function verifyShowAllNestedSafesVisible() {
  cy.contains(showAllNestedSafesStr).scrollIntoView().should('be.visible')
}

export function verifyShowAllNestedSafesNotVisible() {
  cy.contains(showAllNestedSafesStr).should('not.exist')
}

export function clickFirstValidSafeCheckbox() {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .filter(`:not(:has(${suspiciousWarningIcon}))`)
    .first()
    .find('input[type="checkbox"]')
    .click()
}

export function selectAllValidSafes() {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .filter(`:not(:has(${suspiciousWarningIcon}))`)
    .each(($item) => {
      cy.wrap($item).find('input[type="checkbox"]').click()
    })
}

// Select ALL safes regardless of warning status (for tests that need specific safes)
export function selectAllSafes() {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .each(($item) => {
      cy.wrap($item).find('input[type="checkbox"]').click()
    })
}

export function clickFirstSuspiciousSafeCheckbox() {
  cy.get(nestedSafeList)
    .find(safeListItem)
    .filter(`:has(${suspiciousWarningIcon})`)
    .first()
    .find('input[type="checkbox"]')
    .click()
}

export function waitForNestedSafeListToLoad() {
  cy.get(nestedSafeList).should('be.visible')
  cy.get(safeListItem).should('exist')
}

export function waitForEditModeToLoad() {
  cy.get(cancelManageBtn).should('be.visible')
  cy.get(saveManageBtn).should('be.visible')
}

// Intro screen functions
export function verifyIntroScreenVisible() {
  cy.get(reviewNestedSafesBtn).should('be.visible')
  cy.contains('Select Nested Safes').should('be.visible')
  cy.contains('Nested Safes can include lookalike addresses').should('be.visible')
}

export function clickReviewNestedSafesBtn() {
  cy.get(reviewNestedSafesBtn).click()
}

export function waitForIntroScreenToLoad() {
  cy.get(nestedSafeList).should('be.visible')
  cy.get(reviewNestedSafesBtn).should('be.visible')
}

// Complete intro screen flow, selecting all safes (including suspicious ones)
// Use this for tests that need specific safes to be visible
export function completeIntroScreenSelectAll() {
  // Wait for intro screen to load
  cy.get(nestedSafeList).should('be.visible')
  cy.get(reviewNestedSafesBtn).should('be.visible').click()
  // Wait for manage mode to load
  cy.get(saveManageBtn).should('be.visible')
  // Select all safes
  cy.get(nestedSafeList)
    .find(safeListItem)
    .each(($item) => {
      cy.wrap($item).find('input[type="checkbox"]').click()
    })
  cy.get(saveManageBtn).click()
  // Wait for normal view to load after save
  cy.get(manageNestedSafesBtn).should('be.visible')
}

// Complete intro screen flow, selecting only valid (non-suspicious) safes
export function completeIntroScreenSelectValid() {
  // Wait for intro screen to load
  cy.get(nestedSafeList).should('be.visible')
  cy.get(reviewNestedSafesBtn).should('be.visible').click()
  // Wait for manage mode to load
  cy.get(saveManageBtn).should('be.visible')
  // Select only valid safes (without warning icon)
  cy.get(nestedSafeList)
    .find(safeListItem)
    .filter(`:not(:has(${suspiciousWarningIcon}))`)
    .each(($item) => {
      cy.wrap($item).find('input[type="checkbox"]').click()
    })
  cy.get(saveManageBtn).click()
  // Wait for normal view to load after save
  cy.get(manageNestedSafesBtn).should('be.visible')
}

// Complete intro screen flow without selecting any safes
export function completeIntroScreenNoSelection() {
  // Wait for intro screen to load
  cy.get(nestedSafeList).should('be.visible')
  cy.get(reviewNestedSafesBtn).should('be.visible').click()
  // Wait for manage mode to load
  cy.get(saveManageBtn).should('be.visible')
  cy.get(saveManageBtn).click()
  // Wait for normal view to load after save
  cy.get(manageNestedSafesBtn).should('be.visible')
}

// "+X more nested safes" indicator functions
export function verifyMoreIndicatorVisible(count) {
  cy.get(moreNestedSafesIndicator).should('be.visible')
  cy.get(moreNestedSafesIndicator).should('contain', `+${count} more nested`)
}

export function verifyMoreIndicatorNotVisible() {
  cy.get(moreNestedSafesIndicator).should('not.exist')
}

export function clickMoreIndicator() {
  cy.get(moreNestedSafesIndicator).click()
}

// Close popover functions
export function closePopover() {
  cy.get(closePopoverBtn).click()
}

export function verifyPopoverClosed() {
  cy.get(nestedSafeList).should('not.exist')
}

export function verifyCloseButtonVisible() {
  cy.get(closePopoverBtn).should('be.visible')
}
