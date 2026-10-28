import * as safeapps from './safeapps.pages.js'

const copyShareBtn = '[data-testid="copy-btn-icon"]'
const exploreAppsBtn = '[data-testid="explore-apps-btn"]'
const viewAllLink = '[data-testid="view-all-link"][href^="/transactions/queue"]'

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

export function clickOnExploreAppsBtn() {
  cy.get(exploreAppsBtn).click()
  cy.get(safeapps.safeAppsList)
    .should('exist')
    .within(() => {
      cy.get('li').should('have.length.at.least', 1)
    })
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
