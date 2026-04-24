import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safeNav from '../pages/safe_navigation.pages'
import * as sideBar from '../pages/sidebar.pages'
import * as assets from '../pages/assets.pages.js'
import * as accountsModal from '../pages/accounts_modal.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import safes from '../../fixtures/safes/static.js'

let staticSafes = []

const newSafeName = 'Added safe 3'
const addedSafe900 = 'Added safe 900'

describe('Safe selector tests - details and currency', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify current safe details are shown in the safe selector trigger', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    safeNav.verifySafeIconVisible()
    safeNav.verifySafeSelectorTriggerAddress(safes.SEP_STATIC_SAFE_9_SHORT)
    safeNav.verifySafeSelectorThreshold(2, 2)
  })

  it.only('Verify fiat currency changes when edited in the assets tab are reflected in the safe selector trigger', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    assets.changeCurrency(assets.currencyCAD)
    safeNav.verifyCurrencySection(assets.currency$)
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
