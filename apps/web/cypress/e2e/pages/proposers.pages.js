import * as constants from '../../support/constants'
import * as main from './main.page'
import * as addressBook from './address_book.page'

const proposersSection = '[data-testid="proposer-section"]'
const addProposerBtn = '[data-testid="add-proposer-btn"]'

const safeAsProposerMessage = 'Cannot add Safe account itself as proposer'

const proposerColumn = 0
const creatorColumn = 1

// The section renders null until the delegates request resolves, which outruns the default 10s.
const proposerSectionTimeout = 30000

function getProposersSection() {
  return cy.get(proposersSection, { timeout: proposerSectionTimeout })
}

// `should` with a callback retries, unlike the `each`-plus-flag it replaces: proposer names arrive
// from the address book migration a tick after the table first renders.
function verifyColumnContains(columnIndex, values) {
  values.forEach((value) => {
    getProposersSection()
      .find(addressBook.tableRow)
      .should(($rows) => {
        const found = $rows.toArray().some((row) => Cypress.$(row).find('td').eq(columnIndex).text().includes(value))
        expect(found, `Value "${value}" should be found in td:eq(${columnIndex}) within proposersSection`).to.be.true
      })
  })
}

/**
 * Without a Workspace plan that grants policies, Safe Pro replaces the "Add proposer" button. Specs that test
 * proposers themselves turn that gate off; call it before the visit.
 */
export function disableProposerGating() {
  main.injectChainFeature({
    chainId: constants.networkKeys.sepolia,
    removeFlag: constants.chainFeatures.proposerGating,
  })
}

export function clickOnAddProposerBtn() {
  cy.get(addProposerBtn).click()
}

function enterProposerName(name) {
  addressBook.typeInNameInput(name)
}
export function enterProposerData(address, name) {
  addressBook.typeInAddress(address)
  enterProposerName(name)
}

export function checkCreatorAddress(data) {
  verifyColumnContains(creatorColumn, data)
}

export function checkProposerData(data) {
  verifyColumnContains(proposerColumn, data)
}

export function checkSafeAsProposerErrorMessage() {
  cy.contains('label', safeAsProposerMessage).should('exist')
}
