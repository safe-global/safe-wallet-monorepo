import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as create_wallet from '../pages/create_wallet.pages.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
// DO NOT use OWNER_2_PRIVATE_KEY for safe creation. Used for CF safes.
const signer2 = walletCredentials.OWNER_2_PRIVATE_KEY

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

  it('Verify the list of networks where the safe is already deployed with the same address when all networks added', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.addNetwork(constants.networks.ethereum)
    cy.contains(sideBar.createSafeMsg(constants.networks.ethereum))
    sideBar.checkUndeployedSafeExists(0)
    navigation.clickOnModalCloseBtn(0)
    create_wallet.openNetworkSelector()
    sideBar.checkNetworkPresence(
      [constants.networks.ethereum, constants.networks.polygon, constants.networks.sepolia],
      sideBar.addedNetworkOption,
    )
  })

  it('Verify that the selected network is already pre-selected in the "Add Another Network" pop-up and cannot be modified', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksBtn()
    sideBar.checkNetworkPresence([constants.networks.ethereum], sideBar.addNetworkOption).click()
    sideBar.checkNetworkIsNotEditable()
  })

  it('Verify Show all networks displays the full list of not added networks', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksBtn()
    sideBar.checkNetworkPresence([constants.networks.ethereum], sideBar.addNetworkOption)
    main.verifyMinimumElementsCount(sideBar.addNetworkOption, 1)
  })

  it('Verify that test networks and main networks are splitted', () => {
    create_wallet.openNetworkSelector()
    sideBar.checkNetworksInRange(constants.networks.sepolia, 1, 'below')
    sideBar.checkNetworksInRange(constants.networks.polygon, 1, 'above')
  })

  it('Verify Add network tooltip on hover for available networks in "Show all networks"', () => {
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksBtn()
    sideBar.checkNetworkPresence([constants.networks.ethereum], sideBar.addNetworkOption).trigger('mouseover')
    main.verifyElementsExist([sideBar.addNetworkTooltip])
  })

  it('Verify that CF safe is created if other available network is selected from the "Show all networks"', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksBtn()
    sideBar.checkNetworkPresence([constants.networks.ethereum], sideBar.addNetworkOption).click()
    sideBar.getModalAddNetworkBtn().click()
    sideBar.openSidebar()
    sideBar.checkUndeployedSafeExists(0)
    cy.wrap(null, { timeout: 10000 }).then(() => {
      cy.window().then((window) => {
        const addressBook = JSON.parse(window.localStorage.getItem(constants.localStorageKeys.SAFE_v2__addressBook))

        expect(addressBook).to.have.property('1')
        expect(addressBook['1']).to.have.property(
          staticSafes.MATIC_STATIC_SAFE_28.substring(6),
          sideBar.multichainSafes.sepolia,
        )
      })
    })
  })
})
