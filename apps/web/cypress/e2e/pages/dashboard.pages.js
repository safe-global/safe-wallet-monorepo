import * as main from './main.page.js'
import * as createtx from './create_tx.pages.js'

export const copiedAppUrl = 'share/safe-app?appUrl'

const sendButtonDashboard = '[data-testid="send-button-dashboard"]'
const receiveButtonDashboard = '[data-testid="receive-button-dashboard"]'
const viewAllLink = '[data-testid="view-all-link"]'
const noTxText = '[data-testid="no-tx-text"]'
export const pendingTxWidget = '[data-testid="pending-tx-widget"]'
export const pendingTxItem = '[data-testid="tx-pending-item"]'
export const txDate = '[data-testid="tx-date"]'
export const assetsWidget = '[data-testid="assets-widget"]'
const noAssets = '[data-testid="no-assets"]'
const assetsItem = '[data-testid="assets-item"]'
const singleTxDetailsHeader = '[data-testid="tx-details"]'

const copyShareBtn = '[data-testid="copy-btn-icon"]'

export function clickOnTxByIndex(index) {
  cy.get(pendingTxItem).eq(index).should('be.visible').click()
  cy.get(singleTxDetailsHeader).should('be.visible')
}

export function verifySingleTxItem(data) {
  main.checkTextsExistWithinElement(createtx.transactionItem, data)
}

export function verifyDataInPendingTx(data) {
  main.checkTextsExistWithinElement(pendingTxWidget, data)
}

export function verifyTxItemInPendingTx(data) {
  let matchFound = false

  cy.get(pendingTxItem)
    .each(($item) => {
      const itemText = $item.text()
      const isMatch = data.every((tx) => itemText.includes(tx))

      if (isMatch) {
        matchFound = true
        return false
      }
    })
    .then(() => {
      expect(matchFound).to.be.true
    })
}

export function verifyEmptyTxSection() {
  main.verifyElementsIsVisible([noTxText])
}

export function clickOnViewAllBtn() {
  cy.get(viewAllLink).click()
}

export function pinAppByIndex(index) {
  return cy
    .get('[aria-label*="Pin"]')
    .eq(index)
    .click()
    .then(() => {
      cy.wait(1000)
      return cy.get('[aria-label*="Unpin"]').eq(0).invoke('attr', 'aria-label')
    })
}

export function clickOnPinBtnByName(name) {
  cy.get(`[aria-label="${name}"]`).click()
}

export function verifyPinnedAppsCount(count) {
  cy.get(`[aria-label*="Unpin"]`).should('have.length', count)
}

export function verifyShareBtnWorks(index, data) {
  cy.get(copyShareBtn)
    .eq(index)
    .click()
    .wait(1000)
    .then(() =>
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          expect(text).to.contain(data)
        })
      }),
    )
}

export function verifyDashboardHeader() {
  cy.get(sendButtonDashboard).should('be.visible').and('not.be.disabled')
  cy.get(receiveButtonDashboard).should('be.visible')
}

export function verifyPendingTxWidget() {
  cy.get(pendingTxWidget).should('be.visible')
  cy.get(pendingTxWidget).then(($widget) => {
    const $empty = $widget.find(noTxText)
    const $items = $widget.find(pendingTxItem)
    const $viewAll = $widget.find(viewAllLink)
    const isEmpty = $empty.length > 0 && $empty.is(':visible')
    const hasItemsAndViewAll = $items.length >= 1 && $viewAll.length > 0
    expect(isEmpty || hasItemsAndViewAll, 'Pending widget should show either empty state or items with view-all').to.be
      .true
  })
}

export function verifyPendingTxWidgetWithTxs() {
  cy.get(pendingTxWidget).should('be.visible')
  cy.get(noTxText).should('not.exist')
  main.verifyMinimumElementsCount(pendingTxItem, 1)
  cy.get(viewAllLink).should('be.visible')
}

export function verifyAssetsWidget() {
  cy.get(assetsWidget).should('be.visible')
  cy.get(assetsWidget).then(($widget) => {
    const $empty = $widget.find(noAssets)
    const $items = $widget.find(assetsItem)
    const isEmpty = $empty.length > 0 && $empty.is(':visible')
    const hasItems = $items.length >= 1
    expect(isEmpty || hasItems, 'Assets widget should show either empty state or at least one asset').to.be.true
  })
}
