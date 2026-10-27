import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as network from '../pages/network.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Multichain header network switch tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.wait(2000)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set5)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.multichain)
  })

  it('Verify that the selected network is already pre-selected in the "Add Another Network" pop-up and cannot be modified', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    network.clickChainNavigationButton()
    network.clickAllNetworksAccordion()
    network.clickAddNetworkBtn(constants.networks.ethereum)
    network.verifyAddedNetworkInDialog(constants.networks.ethereum)
    network.verifyNetworkInputAbsentInDialog()
  })
})
