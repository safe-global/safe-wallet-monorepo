import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
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
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.wait(2000)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set5)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.multichain)
    wallet.connectSigner(signer)
  })

  it('Verify CF safe can be created when adding a new network from more options menu', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    sideBar.openSidebar()
    sideBar.addNetwork(constants.networks.ethereum)
    cy.contains(sideBar.createSafeMsg(constants.networks.ethereum))
    cy.url().should('include', safe)
    sideBar.checkUndeployedSafeExists(0)
    cy.wrap(null, { timeout: 10000 }).then(() => {
      cy.window().then((window) => {
        const addressBook = JSON.parse(window.localStorage.getItem(constants.localStorageKeys.SAFE_v2__addressBook))

        expect(addressBook).to.have.property('1')
        expect(addressBook['1']).to.have.property(
          staticSafes.MATIC_STATIC_SAFE_28.substring(6),
          sideBar.multichainSafes.polygon,
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
    sideBar.openSidebar()
    sideBar.removeSafeItem(sideBar.undeployedSafe)
    cy.wrap(null, { timeout: 10000 }).should(() => {
      expect(localStorage.getItem(constants.localStorageKeys.SAFE_v2__addressBook) === '{}').to.be.true
    })
    sideBar.addNetwork(constants.networks.ethereum)
    cy.contains(sideBar.createSafeMsg(constants.networks.ethereum))
    sideBar.checkUndeployedSafeExists(0)
  })

  it('Verify that "Add network" button in Add another network modal is disabled when network is not selected', () => {
    sideBar.openSidebar()
    sideBar.clickOnAddNetworkBtn()
    sideBar.getModalAddNetworkBtn().should('be.disabled')
  })

  it('Verify that already added network can not be selected', () => {
    sideBar.openSidebar()
    sideBar.clickOnAddNetworkBtn()
    sideBar.clickOnNetworkInput()
    sideBar.getNetworkOptions().should('not.contain', constants.networks.sepolia)
    sideBar.getModalAddNetworkBtn().should('be.disabled')
  })
})
