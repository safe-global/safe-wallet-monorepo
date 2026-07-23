import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safeNav from '../pages/safe_navigation.pages'
import * as sideBar from '../pages/sidebar.pages'
import * as assets from '../pages/assets.pages.js'
import * as accountsModal from '../pages/accounts_modal.pages.js'
import * as ls from '../../support/localstorage_data.js'
import * as create_wallet from '../pages/create_wallet.pages.js'
import * as dashboard from '../pages/dashboard.pages.js'
import * as navigation from '../pages/navigation.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import safes from '../../fixtures/safes/static.js'

let staticSafes = []

const newSafeName = 'Added safe 3'
const addedSafe900 = 'Added safe 900'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer1 = walletCredentials.OWNER_1_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_PRIVATE_KEY

describe('Safe selector tests - connect wallet prompt', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify connect wallet button is shown in the dropdown when wallet is not connected and no safes are added', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9, { skipAutoTrust: true })
    safeNav.openSelector()
    safeNav.verifyConnectWalletBtnVisible()
  })
})

describe('Safe selector tests - details and currency', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify current safe details are shown in the safe selector trigger', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    safeNav.verifySafeIconVisible()
    safeNav.verifySafeSelectorTriggerName(safes.SEP_STATIC_SAFE_9_SHORT)
    safeNav.verifySafeSelectorThreshold(2, 2)
  })

  it('Verify fiat currency changes when edited in the assets tab are reflected in the safe selector trigger', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    assets.changeCurrency(assets.currencyCAD)
    safeNav.verifyCurrencySection(assets.currency$)
  })
})

describe('Safe selector tests - trusted safes in accounts modal', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1Safe2)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
  })

  it('Verify that trusted safes appear in the accounts modal under Trusted Safes', () => {
    accountsModal.openAccountsModal()
    accountsModal.verifyPinnedAccountsSectionVisible()
    accountsModal.verifyPinnedSafeExists(sideBar.sideBarSafes.safe1short)
    accountsModal.verifyPinnedSafeExists(sideBar.sideBarSafes.safe2short)
  })

  it('Verify there is an option to rename an unnamed safe in the accounts modal', () => {
    accountsModal.openAccountsModal()
    accountsModal.clickSafeOptionsBtn(0)
  })
})

describe('Safe selector tests - pin/unpin and undeployed safes', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify "Add accounts" button is displayed on the accounts page', () => {
    wallet.connectSignerViaStorage(signer, constants.welcomeAccountsSepoliaUrl)
    accountsModal.verifyAddAccountsButtonVisible()
  })

  it('Verify a safe can be removed from the trusted list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1Safe2)
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.verifyPinnedAccountsSectionVisible()
    accountsModal.unpinSafeByName(sideBar.sideBarSafes.safe1short)
    accountsModal.openAccountsModal()
    accountsModal.verifyPinnedSafeExists(sideBar.sideBarSafes.safe2short)
    accountsModal.verifyPinnedSafeDoesNotExist(sideBar.sideBarSafes.safe1short)
  })

  it('Verify undeployed safe appears in the trusted list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set6_undeployed_safe)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.verifyPinnedAccountsSectionVisible()
    accountsModal.verifyPinnedSafeExists(sideBar.sideBarSafes.safe4short)
  })

  it('Verify untrusted safe can be added to trusted list from dashboard action required panel', () => {
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9, { skipAutoTrust: true })
    dashboard.verifyActionRequiredCard({ messages: [dashboard.nonPinnedWarningTitle] })
    dashboard.clickActionInPanel(dashboard.trustThisSafeButtonTestId)
    dashboard.verifyTrustDialogVisible()
  })
})

describe('Safe selector tests - accounts modal search', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the search input is shown above the pinned safes list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.verifySearchInputAbovePinnedSection()
  })

  it('Verify search finds safes in the trusted list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1Safe2)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.searchSafe(sideBar.sideBarSafes.safe1short_)
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.safe1short)
    accountsModal.verifyAccountsListItemCount(1)
  })

  it('Verify searching for a safe name filters out those who do not match', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1Safe2)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.searchSafe(sideBar.sideBarSafes.safe1short_)
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.safe1short)
    accountsModal.verifyAccountsListDoesNotContain(sideBar.sideBarSafes.safe2short)
  })

  it('Verify searching for a safe also finds safes in different networks', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe3TwoChains)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.searchSafe(sideBar.sideBarSafes.multichain_short_)
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.multichain_short_)
  })

  it('Verify clearing the search input returns back to the full list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedSafe1Safe2)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.searchSafe(sideBar.sideBarSafes.safe1short_)
    accountsModal.verifyAccountsListDoesNotContain(sideBar.sideBarSafes.safe2short)
    accountsModal.clearSearchInput()
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.safe1short)
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.safe2short)
  })
})

describe('Safe selector tests - accounts modal actions', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify Import button is present on the accounts page', () => {
    wallet.connectSignerViaStorage(signer, constants.welcomeAccountsSepoliaUrl)
    accountsModal.verifyImportBtnVisible()
  })

  it('Verify safes added to watchlist appear in the accounts modal', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    wallet.connectSignerViaStorage(signer1, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    accountsModal.openAccountsModal()
    accountsModal.verifyAccountsListContains(sideBar.sideBarSafes.safe3short)
  })

  it('Verify missing signature info is shown for a safe in the accounts modal', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedPendingSafe1)
    wallet.connectSignerViaStorage(signer2, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    accountsModal.openAccountsModal()
    accountsModal.verifyMissingSignatureInfoExists()
  })

  it('Verify balance is displayed in the accounts modal safe item', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedPendingSafe1)
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    accountsModal.openAccountsModal()
    accountsModal.verifyFiatBalanceExists()
  })
})

describe('Safe selector tests - added safes', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set2)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.addedSafes)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
  })

  it('Verify added safes are listed in the safe selector dropdown', () => {
    safeNav.openSelector()
    safeNav.verifyAddedSafesInDropdown(sideBar.addedSafesSepolia)
  })

  it('Verify a safe can be renamed via the accounts modal', () => {
    accountsModal.openAccountsModal()
    accountsModal.renameSafe(addedSafe900, newSafeName)
    accountsModal.verifyAccountsListContains(newSafeName)
  })
})

describe('Safe selector tests - watchlist in dropdown', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that safes the user does not own appear in the safe selector dropdown after adding them', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    wallet.connectSignerViaStorage(signer2, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)

    safeNav.openSelector()

    safeNav.verifyDropdownContainsSafe(sideBar.sideBarSafes.safe3short)
  })

  it('Verify that safes the user owns appear in the safe selector dropdown after adding them', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    wallet.connectSignerViaStorage(signer1, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)

    safeNav.openSelector()

    safeNav.verifyDropdownContainsSafe(sideBar.sideBarSafes.safe3short)
  })

  it('Verify that a watched safe with a pending tx appears in the safe selector dropdown', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.sidebarTrustedPendingSafe1)
    wallet.connectSignerViaStorage(signer2, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)

    safeNav.openSelector()

    safeNav.verifyDropdownContainsSafe(sideBar.sideBarSafesPendingActions.safe1short)
  })

  it('Verify the first row in the safe selector dropdown shows a balance', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)

    safeNav.openSelector()

    safeNav.verifyFirstDropdownRowHasBalance()
  })
})

describe('Safe selector tests - new transaction button states', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the new transaction button is enabled for proposers', () => {
    wallet.connectSignerViaStorage(signer1, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_31)

    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
  })

  it('Verify the new transaction button is disabled for disconnected users', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)

    navigation.verifyTxBtnStatus(constants.enabledStates.disabled)
  })

  it('Verify the new transaction button is disabled for connected non-owners', () => {
    wallet.connectSignerViaStorage(signer1, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)

    navigation.verifyTxBtnStatus(constants.enabledStates.disabled)
  })

  it('Verify the new transaction button is enabled for non-owners with spending limits', () => {
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_11)

    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
  })
})

describe('Safe selector tests - add safe button', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify selecting an existing safe from Add accounts opens the load flow', () => {
    wallet.connectSignerViaStorage(signer, constants.welcomeAccountsSepoliaUrl)

    accountsModal.clickAddAccountsSelectExistingAndVerifyLoadFlow()
  })
})

describe('Safe selector tests - threshold tag visible for owners and non-owners', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the threshold badge is shown on safe cards for both owner and non-owner safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set3)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.addedSafes)
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_11)
    accountsModal.openAccountsModal()

    accountsModal.verifyThresholdBadgeOnSafeCard('Added owner')
    accountsModal.verifyThresholdBadgeOnSafeCard('Added non-owner')
  })
})
