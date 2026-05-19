import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safeNav from '../pages/safe_navigation.pages'
import * as network from '../pages/network.pages.js'
import * as dashboard from '../pages/dashboard.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as create_wallet from '../pages/create_wallet.pages.js'
import * as owner from '../pages/owners.pages.js'

import { suspendOutreachModal } from '../pages/modals.page.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const sidebarNavItem = '[data-testid="sidebar-list-item"]'

describe('Multichain setup tests', { defaultCommandTimeout: 60000 }, () => {
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

  // Renamed from: 'Verify that batch tx with safe activation is not allowed for the CF safes'
  it('Verify that CF safes block transaction creation and signer management', () => {
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')

    network.addNetwork(constants.networks.ethereum)
    cy.contains(network.createSafeMsg(constants.networks.ethereum))

    safeNav.openSelector()
    safeNav.expandMultichainRowByAddress(staticSafes.MATIC_STATIC_SAFE_28.split(':')[1].slice(0, 6))
    safeNav.clickNotActivatedSubAccount()

    main.verifyElementsCount(navigation.newTxBtn, 0)
    main.verifyElementsCount(create_wallet.activateAccountBtn, 2)

    cy.visit(constants.setupUrl + safe)
    owner.verifyManageSignersBtnIsDisabled()
    cy.contains(sidebarNavItem, 'Apps').should('be.disabled')
  })

  it('Verify notification if the owner set up was changed in original safe', () => {
    const safeAddress = staticSafes.MATIC_STATIC_SAFE_28.split(':')[1]
    // Mock /v2/safes to return deviating owners across chains — triggers InconsistentSignerSetupWarning
    cy.intercept('GET', '**/v2/safes**', [
      {
        address: { value: safeAddress },
        chainId: '137',
        threshold: 1,
        owners: [{ value: constants.DEFAULT_OWNER_ADDRESS }],
        fiatTotal: '0',
        queued: 0,
      },
      {
        address: { value: safeAddress },
        chainId: '11155111',
        threshold: 1,
        owners: [{ value: constants.SEPOLIA_OWNER_2 }],
        fiatTotal: '0',
        queued: 0,
      },
    ])

    cy.visit(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_28)
    dashboard.expandActionRequiredPanel()
    dashboard.checkInconsistentSignersMsgDisplayed()
    dashboard.clickActionInPanel(dashboard.reviewSignersTestId)
    cy.url().should('include', '/settings/setup').and('include', staticSafes.MATIC_STATIC_SAFE_28)
  })

  it('Verify warning on add owner for one safe in the group', () => {
    cy.visit(constants.setupUrl + staticSafes.MATIC_STATIC_SAFE_28)
    owner.openManageSignersWindow()
    owner.clickOnAddSignerBtn()
    owner.typeOwnerAddressManage(4, constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtnManage()

    owner.verifyInconsistentSignersWarning(constants.networks.polygon)
  })

  it('Verify warning on remove owner for one safe in the group', () => {
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)

    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.openRemoveOwnerWindow(1)
    cy.wait(1000)
    create_wallet.clickOnNextBtn()

    owner.verifyInconsistentSignersWarning(constants.networks.sepolia)
  })

  it('Verify warning on change policy for one safe in the group', () => {
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)
    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.clickOnChangeThresholdBtn()
    create_wallet.updateThreshold(2)
    owner.clickOnThresholdNextBtn()

    owner.verifyInconsistentSignersWarning(constants.networks.sepolia)
  })

  it('Verify warning on swap owner for one safe in the group', () => {
    const safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)
    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.openReplaceOwnerWindow(1)
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    cy.wait(2000)
    owner.clickOnNextBtn()

    owner.verifyInconsistentSignersWarning(constants.networks.sepolia)
  })
})
