import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as create_wallet from '../pages/create_wallet.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Sidebar tests 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify current safe is shown when no trusted safes exist', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9, { skipAutoTrust: true })
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    cy.get(sideBar.currentSafeSection).should('exist')
    cy.get('[data-testid="pinned-accounts"]').should('not.exist')
  })

  it('Verify connect wallet prompt when wallet is not connected and no trusted safes', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9, { skipAutoTrust: true })
    sideBar.clickOnOpenSidebarBtn()
    cy.wait(500)
    cy.get('[data-testid="connect-wallet-prompt"]').should('exist')
  })

  it('Verify connected user is redirected from welcome page to accounts page', () => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    cy.get(create_wallet.welcomeLoginScreen).should('be.visible')
    cy.get(create_wallet.connectWalletBtn).should('be.visible').click()
    wallet.connectSigner(signer)
    // cy.get(create_wallet.continueWithWalletBtnConnected).should('be.visible').click()
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/welcome/accounts')
    })
    cy.get(create_wallet.accountInfoHeader).should('be.visible')
  })

  it('Verify that trusted safes appear in the sidebar', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe1short, sideBar.sideBarSafes.safe2short])
  })

  it('Verify there is an option to name an unnamed safe', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifySafeGiveNameOptionExists(0)
  })
})
