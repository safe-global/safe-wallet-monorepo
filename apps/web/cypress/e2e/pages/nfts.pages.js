import * as main from '../pages/main.page'

const recipientInput = 'input[name="recipient"]'
export const nftsRow = '[data-testid^="nfts-table-row"]'
const nftCheckBox = (index) => `[data-testid="nft-checkbox-${index}"]`
const selectAllNFTsCheckbox = '[data-slot="checkbox"][title="Select all"]'
export const accordionActionItem = '[data-testid="action-item"]'

export function verifyDataInTable(name, address, tokenID) {
  cy.get(nftsRow).contains(name)
  cy.get(nftsRow).contains(address)
  cy.get(nftsRow).contains(tokenID)
}

export function waitForNftItems(count) {
  cy.get(nftsRow).should('have.length.at.least', count)
}

export function selectNFTs(numberOfNFTs) {
  for (let i = 1; i <= numberOfNFTs; i++) {
    cy.get(nftCheckBox(i)).click()
    cy.contains(`${i} NFT${i > 1 ? 's' : ''} selected`)
  }
  checkSelectedNFTsNumberIs(numberOfNFTs)
}

export function selectAllNFTs() {
  cy.get(selectAllNFTsCheckbox).click()
}

export function checkSelectedNFTsNumberIs(numberOfNFTs) {
  cy.contains('button', `Send ${numberOfNFTs} NFT${numberOfNFTs > 1 ? 's' : ''}`)
}

export function typeRecipientAddress(address) {
  cy.get(recipientInput).type(address)
}
