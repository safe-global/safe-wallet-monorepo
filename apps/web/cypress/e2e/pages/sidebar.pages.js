import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import * as modal from './modals.page.js'
import * as navigation from './navigation.page.js'
import { safeHeaderInfo } from './import_export.pages.js'
import * as file from './import_export.pages.js'
import safes from '../../fixtures/safes/static.json'
import * as address_book from './address_book.page.js'
import * as create_wallet from '../pages/create_wallet.pages.js'

export const chainLogo = '[data-testid="chain-logo"]'
const safeIcon = '[data-testid="safe-icon"]'
const sidebarContainer = '[data-testid="sidebar-container"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const qrModalBtn = '[data-testid="qr-modal-btn"]'
export const copyAddressBtn = '[data-testid="copy-address-btn"]'
const explorerBtn = '[data-testid="explorer-btn"]'
export const sideBarListItem = '[data-testid="sidebar-list-item"]'
const sideBarListItemWhatsNew = '[data-testid="list-item-whats-new"]'
const sideBarListItemNeedHelp = '[data-testid="list-item-need-help"]'
const sideSafeListItem = '[data-testid="safe-list-item"]'
const sidebarSafeHeader = '[data-testid="safe-header-info"]'
const sidebarSafeContainer = '[data-testid="sidebar-safe-container"]'
const safeItemOptionsBtn = '[data-testid="safe-options-btn"]'
export const safeItemOptionsRenameBtn = '[data-testid="rename-btn"]'
export const safeItemOptionsRemoveBtn = '[data-testid="remove-btn"]'
export const safeItemOptionsAddChainBtn = '[data-testid="add-chain-btn"]'
const nameInput = '[data-testid="name-input"]'
const saveBtn = '[data-testid="save-btn"]'
const deleteBtn = '[data-testid="delete-btn"]'
const readOnlyVisibility = '[data-testid="read-only-visibility"]'
const currencySection = '[data-testid="currency-section"]'
const missingSignatureInfo = '[data-testid="missing-signature-info"]'
const queuedTxInfo = '[data-testid="queued-tx-info"]'
const expandSafesList = '[data-testid="expand-safes-list"]'
export const importBtn = '[data-testid="import-btn"]'
export const pendingActivationIcon = '[data-testid="pending-activation-icon"]'
const safeItemMenuIcon = '[data-testid="MoreVertIcon"]'
const multichainItemSummary = '[data-testid="multichain-item-summary"]'
const addChainDialog = "[data-testid='add-chain-dialog']"
export const addNetworkBtn = "[data-testid='add-network-btn']"
const modalAddNetworkBtn = "[data-testid='modal-add-network-btn']"
const subAccountContainer = '[data-testid="subacounts-container"]'
const groupBalance = '[data-testid="group-balance"]'
const groupAddress = '[data-testid="group-address"]'
const groupSafeIcon = '[data-testid="group-safe-icon"]'
const multichainTooltip = '[data-testid="multichain-tooltip"]'
const networkInput = '[id="network-input"]'
const networkOption = 'li[role="option"]'
const showAllNetworks = '[data-testid="show-all-networks"]'
const showAllNetworksStr = 'Show all networks'
export const addNetworkOption = 'li[aria-label="Add network"]'
export const addedNetworkOption = 'li[role="option"]'
const modalAddNetworkName = '[data-testid="added-network"]'
const networkSeperator = 'div[role="separator"]'
export const addNetworkTooltip = '[data-testid="add-network-tooltip"]'
const pinnedAccountsContainer = '[data-testid="pinned-accounts"]'
const emptyPinnedList = '[data-testid="empty-pinned-list"]'
const boomarkIcon = '[data-testid="bookmark-icon"]'
const emptyAccountList = '[data-testid="empty-account-list"]'
const searchInput = '[id="search-by-name"]'
const accountsList = '[data-testid="accounts-list"]'
const sortbyBtn = '[data-testid="sortby-button"]'
export const currentSafeSection = '[data-testid="current-safe-section"]'
const readOnlyChip = '[data-testid="read-only-chip"]'
const addSafeBtn = '[data-testid="add-safe-button"]'
const indexStatusSection = '[data-testid="index-status"]'
const needHelpBtn = '[data-testid="need-help-btn"]'
const openNestedSafeListBtn = '[data-track="nested-safes: Open nested Safe list"]'
const nestedSafeListPopover = '[data-testid="nested-safe-list"]'
const breadcrumpContainer = '[data-testid="safe-breadcrumb-container"]'
const parentSafeItem = 'div[aria-label="Parent Safe"]'
const nestedSafeItem = 'div[aria-label="Nested Safe"]'

export function clickOnOpenNestedSafeListBtn() {
  cy.get(openNestedSafeListBtn).click()
}

export function checkSafesInPopverList(safes) {
  main.verifyValuesExist(nestedSafeListPopover, safes)
}

export function checkSafesCountInPopverList(number) {
  main.verifyElementsCount(nestedSafeListPopover, number)
}

export function clickOnSafeInPopover(safe) {
  cy.get(nestedSafeListPopover).within(() => {
    cy.contains(safe).click()
  })
}

export function clickOnParentSafeInBreadcrumb() {
  cy.get(breadcrumpContainer).within(() => {
    cy.get(parentSafeItem).within(() => {
      cy.get('a').click()
    })
  })
}

export function checkParentSafeInBreadcrumb(name, address) {
  cy.get(breadcrumpContainer).within(() => {
    cy.get(parentSafeItem).within(() => {
      cy.get(`a[href="/home?safe=${address}"]`).should('contain', name)
    })
  })
}

export function checkNestedSafeInBreadcrumb(name) {
  cy.get(breadcrumpContainer).within(() => {
    cy.get(nestedSafeItem).within(() => {
      cy.get('p').should('contain', name)
    })
  })
}

export const importBtnStr = 'Import'
export const exportBtnStr = 'Export'
export const undeployedSafe = 'Undeployed Sepolia'
export const notActivatedStr = 'Not activated'
export const addingNetworkNotPossibleStr = 'Adding another network is not possible for this Safe.'
export const createSafeMsg = (network) => `Successfully added your account on ${network}`
const signersNotConsistentMsg = 'Signers are not consistent'
const signersNotConsistentMsg2 = (network) => `Signers are different on these networks of this account:${network}`
const signersNotConsistentMsg3 =
  'To manage your account easier and to prevent lose of funds, we recommend keeping the same signers'
const signersNotConsistentConfirmTxViewMsg = (network) =>
  `Signers are not consistent across networks on this account. Changing signers will only affect the account on ${network}`
const activateStr = 'You need to activate your Safe first'
const emptyPinnedMessage = 'Personalize your account list by clicking theicon on the accounts most important to you.'

export const addedSafesEth = ['0x8675...a19b']
export const addedSafesSepolia = ['0x6d0b...6dC1', '0x5912...fFdb', '0x0637...708e', '0xD157...DE9a']
export const sideBarListItems = ['Home', 'Assets', 'Transactions', 'Address book', 'Apps', 'Settings', 'Swap']
export const sideBarSafes = {
  safe1: '0xBb26E3717172d5000F87DeFd391994f789D80aEB',
  safe2: '0x905934aA8758c06B2422F0C90D97d2fbb6677811',
  safe3: '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B',
  safe1short: '0xBb26...0aEB',
  safe1short_: '0xBb26',
  safe2short: '0x9059...7811',
  safe3short: '0x86Cb...2C27',
  safe4short: '0x9261...7E00',
  multichain_short_: '0xC96e',
}

// 0x926186108f74dB20BFeb2b6c888E523C78cb7E00
export const sideBarSafesPendingActions = {
  safe1: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  safe1short: '0x5912...fFdb',
}
export const testSafeHeaderDetails = ['2/2', safes.SEP_STATIC_SAFE_9_SHORT]
const receiveAssetsStr = 'Receive assets'
const emptyPinnedListStr = 'Watch any Safe Account to keep an eye on its activity'
const emptySafeListStr = "You don't have any safes yet"
const accountsRegex = /(My accounts|Accounts) \((\d+)\)/
const confirmTxStr = (number) => `${number} to confirm`
const pedningTxStr = (n) => `${n} pending`
export const confirmGenStr = 'to confirm'
const searchResults = (number) => `Found ${number} result${number === 1 ? '' : 's'}`
const needHelpLink = 'https://help.safe.global'

export const sortOptions = {
  lastVisited: '[data-testid="last-visited-option"]',
  name: '[data-testid="name-option"]',
}

export function whatsNewBtnIsVisible() {
  cy.get(sideBarListItemWhatsNew).should('be.visible')
}

export function checkSearchResults(number) {
  cy.contains(searchResults(number)).should('exist')
}

export function checkNeedHelpBtnLink() {
  cy.get(needHelpBtn).find('a').should('have.attr', 'href', needHelpLink)
}

export const multichainSafes = {
  polygon: 'Multichain polygon',
  sepolia: 'Multichain Sepolia',
}

export function searchSafe(safe) {
  cy.get(searchInput).clear().type(safe, { force: true })
}

export function openSortOptionsMenu() {
  cy.get(sortbyBtn).click()
}

export function selectSortOption(option) {
  cy.get(option).click()
}

export function clearSearchInput() {
  cy.get(searchInput).scrollIntoView().clear({ force: true })
}

export function verifySearchInputPosition() {
  cy.get(searchInput).then(($searchInput) => {
    cy.get(pinnedAccountsContainer).then(($pinnedList) => {
      const searchInputPosition = $searchInput[0].compareDocumentPosition($pinnedList[0])
      expect(searchInputPosition & Node.DOCUMENT_POSITION_FOLLOWING).to.equal(Node.DOCUMENT_POSITION_FOLLOWING)
    })
  })
}

export function verifyNumberOfPendingTxTag(tx) {
  cy.get(pinnedAccountsContainer).within(() => {
    cy.get('span').contains(pedningTxStr(tx))
  })
}

export function verifyPinnedSafe(safe) {
  cy.get(pinnedAccountsContainer).within(() => {
    cy.get(sideSafeListItem).contains(safe)
  })
}

export function verifyCurrentSafe(safe) {
  cy.get(currentSafeSection).within(() => {
    cy.get(sideSafeListItem).contains(safe)
  })
}

export function verifyCurrentSafeReadOnly(number) {
  cy.get(currentSafeSection).within(() => {
    cy.get(readOnlyChip).should('have.length', number)
  })
}

export function verifyIndexStatusPresent() {
  cy.get(indexStatusSection).within(() => {
    cy.get('a').should('have.attr', 'href', constants.indexStatusUrl)
  })
}

export function clickOnAddSafeBtn() {
  cy.get(addSafeBtn).click()
  cy.url().should('include', constants.loadNewSafeUrl)
}

export function verifyCurrentSafeDoesNotExist() {
  cy.get(currentSafeSection).should('not.exist')
}

export function getImportBtn() {
  return cy.get(importBtn).scrollIntoView().should('be.visible')
}
export function clickOnSidebarImportBtn() {
  getImportBtn().click()
  modal.verifyModalTitle(modal.modalTitiles.dataImport)
  file.verifyValidImportInputExists()
}

export function clickOnCopyAddressBtn(expectedData) {
  cy.window().then((win) => {
    cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWrite')
  })
  cy.get(copyAddressBtn).click()
  cy.get('@clipboardWrite', { timeout: 10000 }).should('have.been.called')
  cy.get('@clipboardWrite').then((stub) => {
    const actualCallArgs = stub.args[0][0]
    expect(actualCallArgs).to.include(expectedData)
  })
}

export function showAllSafes() {
  cy.wait(500)
  cy.get('body').then(($body) => {
    if ($body.find(expandSafesList).length > 0) {
      cy.get(expandSafesList).click()
      cy.wait(500)
    }
  })
}

export function verifyAccountsCollapsed() {
  cy.get(expandSafesList).should('have.attr', 'aria-expanded', 'false')
}

export function verifyConnectBtnDisplayed() {
  cy.get(emptyAccountList).within(() => {
    create_wallet.verifyConnectWalletBtnDisplayed()
  })
}

export function verifyNetworkIsDisplayed(netwrok) {
  cy.get(sidebarContainer)
    .should('be.visible')
    .within(() => {
      cy.get(chainLogo).should('contain', netwrok)
    })
}

export function verifySafeHeaderDetails(details) {
  main.checkTextsExistWithinElement(safeHeaderInfo, details)
  main.verifyElementsExist([safeIcon, currencySection])
}

export function clickOnQRCodeBtn() {
  cy.get(qrModalBtn).should('be.visible').click()
}

export function verifyQRModalDisplayed() {
  cy.get(modal.modal).should('be.visible')
  cy.get(modal.modalTitle).should('contain', receiveAssetsStr)
}

export function verifyCopyAddressBtn(data) {
  cy.wait(1000)
  cy.get(sidebarContainer)
    .should('be.visible')
    .within(() => {
      cy.get(copyAddressBtn)
        .click()
        .wait(1000)
        .then(() =>
          cy.window().then((win) => {
            win.navigator.clipboard.readText().then((text) => {
              expect(text).to.contain(data)
            })
          }),
        )
    })
}

export function verifyEtherscanLinkExists() {
  main.verifyMinimumElementsCount(explorerBtn, 1)
  cy.get(sidebarContainer)
    .should('be.visible')
    .within(() => {
      cy.get(explorerBtn).should('have.attr', 'href').and('include', constants.etherscanlLink)
    })
}

export function verifyNewTxBtnStatus(status) {
  main.verifyElementsStatus([navigation.newTxBtn], status)
}

export function verifySideListItems() {
  main.verifyValuesExist(sideBarListItem, sideBarListItems)
  main.verifyElementsExist([sideBarListItemWhatsNew, sideBarListItemNeedHelp])
}

export function verifyTxCounter(counter) {
  cy.get(sideBarListItem).contains(sideBarListItems[2]).should('contain', counter)
}

export function verifyNavItemDisabled(item) {
  cy.get(`div[aria-label*="${activateStr}"]`).contains(item).should('exist')
}

export function verifySafeCount(count) {
  main.verifyMinimumElementsCount(sideSafeListItem, count)
}

export function verifyAccountListSafeCount(count) {
  cy.get(accountsList).within(() => {
    cy.get(sideSafeListItem).should('have.length', count)
  })
}

export function verifyAccountListSafeData(data) {
  cy.get(accountsList).within(() => {
    main.verifyValuesExist(sideSafeListItem, [data])
  })
}

export function clickOnOpenSidebarBtn() {
  cy.get(openSafesIcon).click()
}

// Expands all safes in the sidebar
export function openSidebar() {
  clickOnOpenSidebarBtn()
  cy.wait(500)
  showAllSafes()
  main.verifyElementsExist([sidebarSafeContainer])
}

export function verifyAddedSafesExist(safes) {
  main.verifyValuesExist(sideSafeListItem, safes)
}

export function verifySafesDoNotExist(safes) {
  main.verifyValuesDoNotExist(sidebarSafeContainer, safes)
}

export function verifyAddedSafesExistByIndex(index, safe) {
  cy.get(sideSafeListItem).eq(index).should('contain', safe)
}

export function verifySafesByNetwork(netwrok, safes) {
  cy.get(sidebarSafeContainer).within(() => {
    cy.get(chainLogo)
      .contains(netwrok)
      .parent()
      .next()
      .within(() => {
        main.verifyValuesExist(sideSafeListItem, safes)
      })
  })
}

function getSafeByName(safe) {
  return cy.get(sidebarSafeContainer).find(sideSafeListItem).contains(safe).parents('span').parent().should('exist')
}

function getSafeItemOptions(name) {
  return getSafeByName(name).within(() => {
    cy.get(safeItemOptionsBtn)
  })
}

export function verifySafeReadOnlyState(safe) {
  getSafeItemOptions(safe).find(readOnlyVisibility).should('exist')
}

export function verifyMissingSignature(safe) {
  getSafeItemOptions(safe).find(missingSignatureInfo).should('exist')
}

export function verifyQueuedTx(safe) {
  return getSafeItemOptions(safe).find(queuedTxInfo).should('exist')
}

export function clickOnSafeItemOptionsBtn(name) {
  getSafeItemOptions(name).find(safeItemOptionsBtn).click()
}

export function clickOnSafeItemOptionsBtnByIndex(index) {
  cy.get(safeItemOptionsBtn).eq(index).click()
}

export function expandGroupSafes(index) {
  cy.get(multichainItemSummary).eq(index).click()
}

export function clickOnMultichainItemOptionsBtn(index) {
  cy.get(multichainItemSummary).eq(index).find(safeItemOptionsBtn).click()
}

export function checkMultichainTooltipExists(index) {
  cy.get(multichainItemSummary).eq(index).find(chainLogo).eq(0).trigger('mouseover', { force: true })
  cy.get(multichainTooltip).should('exist')
}

export function checkSafeGroupBalance(index) {
  cy.get(multichainItemSummary)
    .eq(index)
    .find(groupBalance)
    .invoke('text')
    .should('include', '$')
    .and('match', /\$?\s?\d+(\.\d{1,3})?/)
}

export function checkSafeGroupAddress(index, address) {
  cy.get(multichainItemSummary)
    .eq(index)
    .find(groupAddress)
    .invoke('text')
    .then((text) => {
      expect(text).to.include(address)
    })
}
export function checkSafeGroupIconsExist(index, icons) {
  cy.get(multichainItemSummary).eq(index).find(groupSafeIcon).should('have.length', 1)
  cy.get(multichainItemSummary).eq(index).find(safeIcon).should('have.length', icons)
}

export function getSubAccountContainer(index) {
  return cy.get(subAccountContainer).eq(index)
}

export function checkThereIsNoOptionsMenu(index) {
  getSubAccountContainer(index).find(safeItemOptionsBtn).should('not.exist')
}

export function checkUndeployedSafeExists(index) {
  return getSubAccountContainer(index).contains(notActivatedStr).should('exist')
}

export function checkMultichainSubSafeExists(safes) {
  main.verifyValuesExist(subAccountContainer, safes)
}

export function checkAddNetworkBtnPosition(index) {
  cy.get(multichainItemSummary)
    .eq(index)
    .should('exist')
    .within(() => {
      cy.get(addNetworkBtn)
        .should('exist')
        .should('be.visible')
        .then(($btn) => {
          expect($btn.parent().children().last()[0]).to.equal($btn[0])
        })
    })
}
export function clickOnAddNetworkBtn() {
  cy.get(addNetworkBtn).eq(0).click()
  cy.get(addChainDialog).should('be.visible')
}

export function getModalAddNetworkBtn() {
  return cy.get(modalAddNetworkBtn)
}

export function clickOnNetworkInput() {
  cy.get(networkInput).click()
}

export function getNetworkOptions() {
  return cy.get(networkOption)
}

export function addNetwork(network) {
  clickOnAddNetworkBtn()
  clickOnNetworkInput()
  getNetworkOptions().contains(network).click()
  getModalAddNetworkBtn().click()
}

export function renameSafeItem(oldName, newName) {
  clickOnSafeItemOptionsBtn(oldName)
  clickOnRenameBtn()
  typeSafeName(newName)
}

export function removeSafeItem(name) {
  clickOnSafeItemOptionsBtn(name)
  cy.wait(1000)
  clickOnRemoveBtn()
  confirmSafeItemRemoval()
  verifyModalRemoved()
}

function typeSafeName(name) {
  cy.get(nameInput).find('input').clear().type(name)
}

export function clickOnRenameBtn() {
  cy.get(safeItemOptionsRenameBtn).click()
  cy.get(address_book.entryDialog).should('exist')
}

function clickOnRemoveBtn() {
  cy.get(safeItemOptionsRemoveBtn).click()
}

function confirmSafeItemRemoval() {
  cy.get(deleteBtn).click()
}

export function verifySafeNameExists(name) {
  cy.get(sidebarSafeContainer).within(() => {
    cy.get(sideSafeListItem).contains(name)
  })
}

export function verifySafeRemoved(name) {
  main.verifyValuesDoNotExist(sidebarSafeContainer, [name])
}

export function clickOnSaveBtn() {
  cy.get(saveBtn).click()
  verifyModalRemoved()
}

function verifyModalRemoved() {
  main.verifyElementsCount(modal.modalTitle, 0)
}

export function checkCurrencyInHeader(currency) {
  cy.get(sidebarSafeHeader).within(() => {
    cy.get(currencySection).contains(currency)
  })
}

export function checkSafeAddressInHeader(address) {
  main.verifyValuesExist(sidebarSafeHeader, address)
}

export function verifyPinnedListIsEmpty() {
  cy.get(emptyPinnedList).should('contain.text', emptyPinnedMessage).find('svg').should('exist')
}

export function verifySafeListIsEmpty() {
  main.verifyValuesExist(sidebarSafeContainer, [emptySafeListStr])
}

export function verifySafeBookmarkBtnExists(safe) {
  getSafeByName(safe).within(() => {
    cy.get(boomarkIcon).should('exist')
  })
}

export function clickOnBookmarkBtn(safe) {
  getSafeByName(safe).within(() => {
    cy.get(boomarkIcon).click()
    cy.wait(500)
  })
}

export function verifySafeGiveNameOptionExists(index) {
  cy.get(safeItemMenuIcon).eq(index).click()
  clickOnRenameBtn()
}

export function checkAccountsCounter(value) {
  verifySafeCount(2)
  cy.get(sidebarSafeContainer)
    .should('exist')
    .then(($el) => {
      const text = $el.text()
      const match = text.match(accountsRegex)
      expect(match).not.to.be.null
      expect(match[0]).to.exist
    })
}

export function checkTxToConfirm(numberOfTx) {
  const str = confirmTxStr(numberOfTx)
  main.verifyValuesExist(sideSafeListItem, [str])
}

export function verifyTxToConfirmDoesNotExist() {
  main.verifyValuesDoNotExist(sideSafeListItem, [confirmGenStr])
}

export function checkBalanceExists() {
  const balance = new RegExp(`\\s*\\d*\\.?\\d*\\s*`, 'i')
  const element = cy.get(chainLogo).prev().contains(balance)
}

export function clickOnAddOptionsBtn() {
  cy.get(safeItemOptionsAddChainBtn).click()
}

export function checkAddChainDialogDisplayed() {
  clickOnAddOptionsBtn()
  cy.get(addChainDialog).should('be.visible')
}

export function clickOnShowAllNetworksBtn() {
  cy.get(showAllNetworks).click()
}

// TODO: Remove after next release due to data-testid availability
export function clickOnShowAllNetworksStrBtn() {
  cy.contains(showAllNetworksStr).click()
}

export function checkNetworkPresence(networks, optionSelector) {
  return cy.get(optionSelector).then((options) => {
    const optionTexts = [...options].map((option) => option.innerText)
    networks.forEach((network) => {
      const isNetworkPresent = optionTexts.some((text) => text.includes(network))
      expect(isNetworkPresent).to.be.true
    })
    cy.wrap([...options].filter((option) => networks.some((network) => option.innerText.includes(network))))
  })
}

export function checkNetworkIsNotEditable() {
  cy.get(addChainDialog).within(() => {
    cy.get(modalAddNetworkName).should('exist')
  })
  cy.get(addChainDialog).find(networkInput).should('not.exist')
}

export function checkNetworksInRange(expectedString, expectedCount, direction = 'below') {
  const networkSeparator = networkSeperator
  const startSelector = networkSeparator
  const endSelector = direction === 'below' ? showAllNetworks : 'ul'

  const traversalMethod = direction === 'below' ? 'nextUntil' : 'prevUntil'

  return cy
    .get(startSelector)
    [traversalMethod](endSelector, 'li')
    .then((liElements) => {
      expect(liElements.length).to.equal(expectedCount)
      const optionTexts = [...liElements].map((li) => li.innerText)
      const isStringPresent = optionTexts.some((text) => text.includes(expectedString))
      expect(isStringPresent).to.be.true
      return cy.wrap(liElements)
    })
}

export function checkInconsistentSignersMsgDisplayed(network) {
  cy.contains(signersNotConsistentMsg).should('exist')
  cy.contains(signersNotConsistentMsg2(network)).should('exist')
  cy.contains(signersNotConsistentMsg3).should('exist')
}

export function checkInconsistentSignersMsgDisplayedConfirmTxView(network) {
  cy.contains(signersNotConsistentConfirmTxViewMsg(network)).should('exist')
}

function getNetworkElements() {
  return cy.get('span[data-track="overview: Add new network"] > li')
}

export function checkNetworkDisabled(networks) {
  getNetworkElements().should('have.length.gte', 20)
  getNetworkElements().each(($el) => {
    const text = $el[0].innerText.trim()
    console.log(`Element text: ${text}`)
    const isDisabledNetwork = networks.some((network) => text.includes(network))
    if (isDisabledNetwork) {
      expect($el).to.have.attr('aria-disabled', 'true')
    } else {
      expect($el).not.to.have.attr('aria-disabled')
    }
  })
}
