import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as modal from '../pages/modals.page'

const nftModalTitle = modal.modalTitle
const nftModal = modal.modal

const nftModalCloseBtn = main.modalDialogCloseBtn
const recipientInput = 'input[name="recipient"]'
export const nftsRow = '[data-testid^="nfts-table-row"]'
const inactiveNftIcon = '[data-testid="nft-icon-border"]'
const activeNftIcon = '[data-testid="nft-icon-primary"]'
const nftCheckBox = (index) => `[data-testid="nft-checkbox-${index}"] > input`
const selectAllNFTsCheckbox = 'span[title="Select all"] > input'
const activeSendNFTBtn = '[data-testid="nft-send-btn-false"]'
const disabledSendNFTBtn = '[data-testid="nft-send-btn-true"]'
const modalTitle = '[data-testid="modal-title"]'
const modalHeader = '[data-testid="modal-header"]'
const modalSelectedNFTs = '[data-testid="selected-nfts"]'
const nftItemList = '[data-testid="nft-item-list"]'
const nftItemNane = '[data-testid="nft-item-name"]'
const txDetailsSummary = '[data-testid="decoded-tx-summary"]'
const txAccordionDetails = '[data-testid="decoded-tx-details"]'
const accordionActionItem = '[data-testid="action-item"]'

const noneNFTSelected = /0 NFT[s]? selected/
const sendNFTStr = 'Send NFTs'
const recipientAddressStr = 'Recipient address or ENS'
const selectedNFTStr = 'Selected NFTs'
const executeBtnStr = 'Execute'
const signBtnStr = 'Sign'
const nextBtnStr = 'Next'
const sendStr = 'Send'
const toStr = 'To'
const transferFromStr = 'safeTransferFrom'

export function verifySendNFTBtnDisabled() {
  cy.get(disabledSendNFTBtn).should('be.visible')
}
export function verifyTxDetails(data) {
  main.verifyValuesExist(txDetailsSummary, data)
}

export function verifyCountOfActions(count) {
  main.verifyElementsCount(accordionActionItem, count)
}

export function verifyActionName(index, name) {
  cy.get(accordionActionItem).eq(index).should('contain', name)
}

export function clickOnNftsTab() {
  cy.get('p').contains('NFTs').click()
}
function verifyTableRows(number) {
  cy.scrollTo('bottom').wait(500)
  cy.get(nftsRow).should('have.length.at.least', number)
}

export function verifyNFTNumber(number) {
  verifyTableRows(number)
}

export function verifyDataInTable(name, address, tokenID) {
  cy.get(nftsRow).contains(name)
  cy.get(nftsRow).contains(address)
  cy.get(nftsRow).contains(tokenID)
}

export function waitForNftItems(count) {
  cy.get(nftsRow).should('have.length.at.least', count)
}

export function openActiveNFT(index) {
  cy.get(activeNftIcon).eq(index).click()
}

export function verifyNameInNFTModal(name) {
  cy.get(nftModalTitle).contains(name)
}

export function verifySelectedNetwrokSepolia() {
  cy.get(nftModal).within(() => {
    cy.get(nftModalTitle).contains(constants.networks.sepolia)
  })
}

export function verifyNFTModalLink(link) {
  cy.get(nftModalTitle).contains(`a[href="${link}"]`, 'View on OpenSea')
}

export function closeNFTModal() {
  cy.get(nftModalCloseBtn).click()
  cy.get(nftModalTitle).should('not.exist')
}

export function clickOnInactiveNFT() {
  cy.get(inactiveNftIcon).eq(0).click()
}
export function verifyNFTModalDoesNotExist() {
  cy.get(nftModalTitle).should('not.exist')
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

export function deselectNFTs(checkboxIndexes, checkedItems) {
  let total = checkedItems - checkboxIndexes.length

  checkboxIndexes.forEach((i) => {
    cy.get(nftCheckBox(i)).uncheck()
  })

  cy.contains(`${total} NFT${total !== 1 ? 's' : ''} selected`)
  if (total === 0) {
    verifyInitialNFTData()
  }
}

export function verifyInitialNFTData() {
  cy.contains(noneNFTSelected)
  cy.contains('button[disabled]', 'Send')
}

export function sendNFT() {
  cy.get(activeSendNFTBtn).click()
}

export function verifyNFTModalData() {
  main.verifyElementsExist([modalTitle, modalHeader, modalSelectedNFTs])
}

export function typeRecipientAddress(address) {
  cy.get(recipientInput).type(address)
}

export function clikOnNextBtn() {
  cy.contains('button', nextBtnStr).click()
}

export function verifyReviewModalData(NFTcount) {
  main.verifyElementsExist([nftItemList])
  main.verifyElementsCount(nftItemNane, NFTcount)
}
