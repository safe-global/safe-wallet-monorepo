import * as main from './main.page'
import * as addressBook from './address_book.page'
import * as batch from './batches.pages'
import * as create_tx from './create_tx.pages'

export const proposersSection = '[data-testid="proposer-section"]'
const addProposerBtn = '[data-testid="add-proposer-btn"]'

const deleteProposerBtn = '[data-testid="delete-proposer-btn"]'
const editProposerBtn = '[data-testid="edit-proposer-btn"]'
const confrimDeleteProposerBtn = '[data-testid="confirm-delete-proposer-btn"]'
const rejectDeleteProposerBtn = '[data-testid="reject-delete-proposer-btn"]'
const submitProposerBtn = '[data-testid="submit-proposer-btn"]'

const safeAsProposerMessage = 'Cannot add Safe Account itself as proposer'
const proposedTxMessage =
  'This transaction was created by a Proposer. Please review and either confirm or reject it. Once confirmed, it can be finalized and executed'
const proposerAddedMsg = 'Proposer added successfully!'

export function verifyPropsalStatusExists() {
  cy.get(create_tx.proposalStatus).should('exist')
}

export function verifyProposerInTxActionList(address) {
  cy.get(create_tx.txSigner).within(() => {
    cy.contains(address)
    cy.get('div[style]')
      .filter((index, element) => {
        return element.style.backgroundImage.includes('url')
      })
      .should('exist')
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

export function checkCreatorAddress(data) {
  cy.get(proposersSection).within(() => {
    Object.entries(data).forEach(([key, value]) => {
      let found = false
      cy.get(addressBook.tableRow)
        .each(($row) => {
          cy.wrap($row)
            .find('td')
            .eq(1)
            .then(($cell) => {
              if ($cell.text().includes(value)) {
                found = true
              }
            })
        })
        .then(() => {
          expect(found, `Value "${value}" should be found in td:eq(1) within proposersSection`).to.be.true
        })
    })
  })
}

export function checkProposerData(data) {
  cy.get(proposersSection).within(() => {
    Object.entries(data).forEach(([key, value]) => {
      let found = false

      cy.get(addressBook.tableRow)
        .each(($row) => {
          cy.wrap($row)
            .find('td')
            .eq(0)
            .then(($cell) => {
              if ($cell.text().includes(value)) {
                found = true
              }
            })
        })
        .then(() => {
          expect(found, `Value "${value}" should be found in td:eq(0) within proposersSection`).to.be.true
        })
    })
  })
}

export function clickOnEditProposerBtn(address) {
  cy.get(proposersSection).within(() => {
    cy.get(addressBook.tableRow).contains(address).parents('tr').find(editProposerBtn).click()
  })
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

export function verifyEditProposerBtnDisabled(address) {
  cy.get(proposersSection).within(() => {
    cy.get(addressBook.tableRow).contains(address).parents('tr').find(editProposerBtn).should('be.disabled')
  })
}

export function verifyDeleteProposerBtnIsDisabled(address) {
  cy.get(proposersSection).within(() => {
    cy.get(addressBook.tableRow).contains(address).parents('tr').find(deleteProposerBtn).should('be.disabled')
  })
}
