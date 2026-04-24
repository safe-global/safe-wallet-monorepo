import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safeNav from '../pages/safe_navigation.pages'
import * as sideBar from '../pages/sidebar.pages'
import * as assets from '../pages/assets.pages.js'
import * as accountsModal from '../pages/accounts_modal.pages.js'
import * as ls from '../../support/localstorage_data.js'
import * as create_wallet from '../pages/create_wallet.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import safes from '../../fixtures/safes/static.js'

let staticSafes = []

const newSafeName = 'Added safe 3'
const addedSafe900 = 'Added safe 900'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

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

describe('Safe selector tests - connect wallet prompt', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify connect wallet button is shown in the dropdown when wallet is not connected and no safes are added', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    safeNav.openSelector()
    safeNav.verifyConnectWalletBtnVisible()
  })
})

describe('Safe selector tests - welcome page redirect', () => {
  it('Verify connected user is redirected from welcome page to accounts page', () => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    cy.get(create_wallet.welcomeLoginScreen).should('be.visible')
    cy.get(create_wallet.connectWalletBtn).should('be.visible').click()
    wallet.connectSigner(signer)
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/welcome/accounts')
    })
    cy.get(create_wallet.accountInfoHeader).should('be.visible')
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
