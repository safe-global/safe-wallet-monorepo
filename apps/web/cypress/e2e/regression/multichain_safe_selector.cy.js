import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safeNav from '../pages/safe_navigation.pages.js'
import * as accountsModal from '../pages/accounts_modal.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Multichain safe selector tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.wait(2000)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set5WithSingleSafe)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.multichain)
    wallet.connectSignerViaStorage(signer)
  })

  it('Verify balance of the safe group', () => {
    safeNav.openSelector()

    safeNav.verifyFirstDropdownRowHasBalance()
  })

  it('Verify address of the safe group', () => {
    const address = staticSafes.MATIC_STATIC_SAFE_28.split(':')[1].substring(0, 6)

    safeNav.openSelector()

    safeNav.verifyDropdownContainsSafe(address)
  })

  it('Verify network logo for safes in the group', () => {
    const address = staticSafes.MATIC_STATIC_SAFE_28.split(':')[1].substring(0, 6)

    safeNav.openSelector()

    safeNav.verifyMultichainSafeChainLogos(address, 2)
  })

  it('Verify Rename and Add network options are available for Group of safes', () => {
    accountsModal.openAccountsModal()

    accountsModal.clickSafeOptionsBtn(0)
  })

  it('Verify Rename option in the group of safes opens a new edit entry modal', () => {
    const newName = 'Renamed multichain safe'

    accountsModal.openAccountsModal()
    accountsModal.renameSafe(safeNav.multichainSafePolygonLabel, newName)

    accountsModal.verifyAccountsListContains(newName)
  })
})
