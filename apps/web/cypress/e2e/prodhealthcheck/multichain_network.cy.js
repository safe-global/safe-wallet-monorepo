import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as create_wallet from '../pages/create_wallet.pages.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[PROD] Multichain add network tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains(createTx.settingsStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
  })

  // TODO: Unskip after next release
  it.skip('Verify that zkSync network is not available as add network option for safes from other networks', () => {
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.clickOnSafeItemOptionsBtnByIndex(0)
    sideBar.clickOnAddNetworkBtn()
    sideBar.clickOnNetworkInput()
    sideBar.getNetworkOptions().contains(constants.networks.zkSync).parent().should('include', 'Not available')
  })

  // Limitation: zkSync network does not support private key. Test might be flaky.
  it('Verify that it is not possible to add networks for the zkSync safes', () => {
    wallet.connectSigner(signer)
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.ZKSYNC_STATIC_SAFE_29)
    sideBar.openSidebar()
    create_wallet.openNetworkSelector()
    cy.contains(sideBar.addingNetworkNotPossibleStr)
  })

  it('Verify that zkSync network is not available during multichain safe creation', () => {
    wallet.connectSigner(signer)
    cy.visit(constants.prodbaseUrl + constants.welcomeUrl + '?chain=sep')
    create_wallet.clickOnContinueWithWalletBtn()
    create_wallet.clickOnCreateNewSafeBtn()
    create_wallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    cy.contains('li', constants.networks.zkSync).should('have.attr', 'aria-disabled', 'true')
  })

  it('Verify that zkSync network is available as part of single safe creation flow ', () => {
    wallet.connectSigner(signer)
    cy.visit(constants.prodbaseUrl + constants.welcomeUrl + '?chain=sep')
    create_wallet.clickOnContinueWithWalletBtn()
    create_wallet.clickOnCreateNewSafeBtn()
    create_wallet.clearNetworkInput(1)
    create_wallet.enterNetwork(1, 'zkSync')
    cy.contains('li', constants.networks.zkSync).should('not.have.attr', 'aria-disabled', 'true')
  })

  it('Verify list of available networks for the safe deployed on one network with mastercopy 1.3.0', () => {
    const safe = 'eth:0x55d93DF21332615D48EA0c0144c7b1D176F3e7cb'
    cy.visit(constants.prodbaseUrl + constants.setupUrl + safe)
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksStrBtn()
    sideBar.checkNetworkDisabled([constants.networks.zkSync, constants.networks.gnosisChiado])
  })

  it('Verify list of available networks for the safe deployed on one network with mastercopy 1.4.1', () => {
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.MATIC_STATIC_SAFE_28)
    create_wallet.openNetworkSelector()
    sideBar.clickOnShowAllNetworksStrBtn()
    sideBar.checkNetworkDisabled([constants.networks.zkSync, constants.networks.gnosisChiado])
  })
})
