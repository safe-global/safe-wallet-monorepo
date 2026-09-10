import * as main from './main.page'
import * as addressBook from './address_book.page'
import * as batch from './batches.pages'
import * as create_tx from './create_tx.pages'

export const proposersSection = '[data-testid="proposer-section"]'
const addProposerBtn = '[data-testid="add-proposer-btn"]'

const deleteProposerBtn = '[data-testid="delete-proposer-btn"]'
const editProposerBtn = '[data-testid="edit-proposer-btn"]'
const confrimDeleteProposerBtn = '[data-testid="confirm-delete-proposer-btn"]'
const submitProposerBtn = '[data-testid="submit-proposer-btn"]'

const safeAsProposerMessage = 'Cannot add Safe account itself as proposer'
const proposedTxMessage = 'This transaction was created by a proposer. Please review and either confirm or reject it.'
const proposerAddedMsg = 'Proposer added successfully!'

const proposerColumn = 0
const creatorColumn = 1

// The section renders null until the delegates request resolves, which outruns the default 10s.
const proposerSectionTimeout = 30000

function getProposersSection() {
  return cy.get(proposersSection, { timeout: proposerSectionTimeout })
}

function getProposerRow(address) {
  return getProposersSection().find(addressBook.tableRow).contains(address).parents('tr')
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

export function verifyPropsalStatusExists() {
  cy.get(create_tx.proposalStatus).should('exist')
}

export function verifyProposerInTxActionList(address) {
  cy.get(create_tx.transactionSideList).within(() => {
    cy.contains(address)
  })
}
export function verifyProposedTxMsgVisible() {
  cy.contains(proposedTxMessage).should('be.visible')
}

export function clickOnAddProposerBtn() {
  cy.get(addProposerBtn).click()
}

export function enterProposerName(name) {
  addressBook.typeInNameInput(name)
}
export function enterProposerData(address, name) {
  addressBook.typeInAddress(address)
  enterProposerName(name)
}

export function clickOnSubmitProposerBtn() {
  cy.get(submitProposerBtn).click()
  verifyProposerSuccessMsgDisplayed()
}

export function saveProposerName() {
  addressBook.clickOnSaveEntryBtn()
  cy.get(addressBook.entryDialog).should('not.exist')
}

export function checkCreatorAddress(data) {
  verifyColumnContains(creatorColumn, data)
}

export function checkProposerData(data) {
  verifyColumnContains(proposerColumn, data)
}

export function clickOnEditProposerBtn(address) {
  getProposerRow(address).find(editProposerBtn).click()
  cy.get(addressBook.entryDialog).should('be.visible')
}

export function confirmProposerDeletion(index) {
  cy.get(confrimDeleteProposerBtn).eq(index).click()
}

export function deleteAllProposers() {
  cy.get('body').then(($body) => {
    if ($body.find(deleteProposerBtn).length > 0) {
      cy.get(deleteProposerBtn)
        .should('be.enabled')
        .then(($items) => {
          for (let i = 0; i < $items.length; i++) {
            cy.wrap($items[i]).click({ force: true })
            confirmProposerDeletion(0)
          }
        })
    }
    main.verifyElementsCount(deleteProposerBtn, 0)
  })
}

export function verifyAddProposerBtnIsDisabled() {
  cy.get(addProposerBtn).should('exist').and('be.disabled')
}

export function checkSafeAsProposerErrorMessage() {
  cy.contains('label', safeAsProposerMessage).should('exist')
}

export function verifyBatchDoesNotExist() {
  main.verifyElementsCount(batch.batchTxTopBar, 0)
}

export function verifyProposerSuccessMsgDisplayed() {
  cy.contains(proposerAddedMsg).should('exist')
}

export function verifyEditProposerBtnEnabled(address) {
  getProposerRow(address).find(editProposerBtn).should('be.enabled')
}

export function verifyDeleteProposerBtnIsDisabled(address) {
  getProposerRow(address).find(deleteProposerBtn).should('be.disabled')
}
