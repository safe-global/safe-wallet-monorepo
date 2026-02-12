import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Sidebar tests 4', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify "Manage trusted Safes" button is displayed in the sidebar', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    cy.wait(500)
    cy.get('[data-testid="add-more-safes-button"]').should('exist')
  })

  it('Verify a safe can be removed from the trusted list', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyPinnedSafe(sideBar.sideBarSafes.safe1short)
    sideBar.clickOnBookmarkBtn(sideBar.sideBarSafes.safe1short)
    sideBar.verifySafeRemoved(sideBar.sideBarSafes.safe1short)
  })

  it('Verify undeployed safe appears when added to trusted list', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    main.addSafeToTrustedList('11155111', '0x926186108f74dB20BFeb2b6c888E523C78cb7E00')
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyPinnedSafe(sideBar.sideBarSafes.safe4short)
  })

  it('Verify untrusted safe can be added to trusted list from dashboard banner', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9, { skipAutoTrust: true })
    wallet.connectSigner(signer)
    cy.get('[data-testid="non-pinned-warning"]').should('exist')
    cy.get('[data-testid="add-to-pinned-list-button"]').click()
    cy.get('[role="dialog"]').should('be.visible')
  })
})
