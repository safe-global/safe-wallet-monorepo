import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safeNav from '../pages/safe_navigation.pages.js'
import * as network from '../pages/network.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

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
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + safe)
    network.addNetwork(constants.networks.ethereum)
    cy.contains(network.createSafeMsg(constants.networks.ethereum))
    network.clickChainNavigationButton()
    network.verifyDeployedChainsInDropdown([
      constants.networks.ethereum,
      constants.networks.polygon,
      constants.networks.sepolia,
    ])
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

  it('Verify Show all networks displays the full list of not added networks', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    network.clickChainNavigationButton()
    network.clickAllNetworksAccordion()
    network.verifyAddNetworkBtnListNotEmpty()
    network.verifyAddNetworkBtnExists(constants.networks.ethereum)
  })

  it('Verify that CF safe is created if other available network is selected from the "Show all networks"', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    network.addNetwork(constants.networks.ethereum)
    cy.contains(network.createSafeMsg(constants.networks.ethereum))
    cy.visit(constants.welcomeAccountUrl)
    safeNav.expandMultichainItem()
    safeNav.verifyNotActivatedSafeExists()
    cy.wrap(null, { timeout: 10000 }).then(() => {
      cy.window().then((window) => {
        const addressBook = JSON.parse(window.localStorage.getItem(constants.localStorageKeys.SAFE_v2__addressBook))
        const safeAddress = staticSafes.MATIC_STATIC_SAFE_28.substring(6)

        expect(addressBook).to.have.property('1')
        expect(addressBook['1']).to.have.property(safeAddress, safeNav.multichainSafePolygonLabel)
      })
    })
  })
})
