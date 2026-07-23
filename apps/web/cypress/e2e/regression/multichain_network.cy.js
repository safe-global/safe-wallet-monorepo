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

describe('Multichain add network tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28, {
      extraStorage: {
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set5,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.multichain,
      },
    })
  })

  it('Verify CF safe can be created when adding a new network from more options menu', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    network.addNetwork(constants.networks.ethereum)
    cy.contains(network.createSafeMsg(constants.networks.ethereum))
    cy.url().should('include', safe)
    cy.visit(constants.welcomeAccountUrl)
    safeNav.expandMultichainItem()
    safeNav.verifyNotActivatedSafeExists()
    cy.wrap(null, { timeout: 10000 }).then(() => {
      cy.window().then((window) => {
        const addressBook = JSON.parse(window.localStorage.getItem(constants.localStorageKeys.SAFE_v2__addressBook))

        expect(addressBook).to.have.property('1')
        expect(addressBook['1']).to.have.property(
          staticSafes.MATIC_STATIC_SAFE_28.substring(6),
          safeNav.multichainSafePolygonLabel,
        )
      })
    })
  })

  it('Verify that CF safe can be removed and re-added using "Add Network"', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set6_undeployed_safe)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.undeployed)
    network.addNetwork(constants.networks.ethereum)
    cy.contains(network.createSafeMsg(constants.networks.ethereum))
    cy.visit(constants.welcomeAccountUrl)
    safeNav.expandMultichainItem()
    safeNav.verifyNotActivatedSafeExists()
  })

  it('Verify that already added network is not shown in the add network list', () => {
    network.clickChainNavigationButton()
    network.clickAllNetworksAccordion()
    network.verifyNetworkNotInAddList(constants.networks.polygon)
  })
})
