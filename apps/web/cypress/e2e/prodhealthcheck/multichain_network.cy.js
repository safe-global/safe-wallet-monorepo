import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
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

  it('Verify that zkSync network is not available during multichain safe creation', () => {
    cy.visit(constants.prodbaseUrl + constants.welcomeUrl + '?chain=sep')
    cy.contains(createTx.getStartedStr, { timeout: 10000 })
    closeSecurityNotice()
    wallet.connectSigner(signer)
    create_wallet.clickOnContinueWithWalletBtn()
    create_wallet.clickOnCreateNewSafeBtn()
    create_wallet.selectMultiNetwork(1, constants.networks.polygon.toLowerCase())
    cy.contains('li', constants.networks.zkSync).should('have.attr', 'aria-disabled', 'true')
  })

  it('Verify that zkSync network is available as part of single safe creation flow ', () => {
    cy.visit(constants.prodbaseUrl + constants.welcomeUrl + '?chain=sep')
    cy.contains(createTx.getStartedStr, { timeout: 10000 })
    closeSecurityNotice()
    wallet.connectSigner(signer)
    create_wallet.clickOnContinueWithWalletBtn()
    create_wallet.clickOnCreateNewSafeBtn()
    create_wallet.clearNetworkInput(1)
    create_wallet.enterNetwork(1, 'zkSync')
    cy.contains('li', constants.networks.zkSync).should('not.have.attr', 'aria-disabled', 'true')
  })
})
