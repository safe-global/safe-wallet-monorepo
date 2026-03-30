import * as constants from '../../support/constants.js'
import * as space from '../pages/spaces.page.js'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const owner = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Spaces dashboard tests', () => {
  beforeEach(() => {
    cy.visit(constants.spacesUrl)
    wallet.connectSigner(owner)
    space.clickOnSignInBtn()
    space.waitForSpacesWelcomeReady()
    space.visitSpaceDashboard(staticSpaces.dashboardWithSafes.id)
  })

  // ===========================================
  // Spaces Dashboard
  // ===========================================

  it('Verify that the Space dashboard loads correctly after login for a user with an existing Space and Safes', () => {
    //space.visitSpaceDashboard(staticSpaces.dashboardWithSafes.id)
    space.verifySpaceDashboardTotalValueFormat()
    space.verifySpaceDashboardWidgetVisible('Accounts')
    // 9 including multichainsafes
    space.verifySpaceDashboardAccountsWidgetRowCount(9)
    space.verifySpaceDashboardWidgetVisible('Pending')
    space.verifyPendingTxWidgetItemCount(3)
  })

  // ===========================================
  // Accounts Widget
  // ===========================================

  it('Verify that the single chain safe row displays name, address, balance and owners threshold', () => {
    const safeData = staticSpaces.dashboardWithSafes.pendingTxAccount

    space.verifySpaceDashboardWidgetVisible('Accounts')
    space.verifySpaceDashboardAccountsRowSafeDetails(staticSpaces.dashboardWithSafes.singleChainAccountRowIndex, {
      name: safeData.name,
      address: safeData.address,
      balanceRegex: space.nonZeroBalanceRegex,
      ownersThreshold: safeData.ownersThreshold,
    })
  })

  it('Verify that the unnamed multichain account row displays shortened address as name and chain logos', () => {
    const account = staticSpaces.dashboardWithSafes.unnamedAccount

    space.verifySpaceDashboardWidgetVisible('Accounts')
    space.verifySpaceDashboardAccountsRowSafeDetails(staticSpaces.dashboardWithSafes.unnamedAccountRowIndex, {
      name: main.shortenAddress(account.address),
      address: account.address,
      balanceRegex: space.zeroBalanceRegex,
      chainLogosCount: account.chainLogosCount,
    })
  })

  it('Verify that the multichain account row with address book name displays name and chain logos', () => {
    const account = staticSpaces.dashboardWithSafes.multichainAccount

    space.verifySpaceDashboardWidgetVisible('Accounts')
    space.verifySpaceDashboardAccountsRowSafeDetails(staticSpaces.dashboardWithSafes.multichainAccountRowIndex, {
      name: account.name,
      address: account.address,
      balanceRegex: space.zeroBalanceRegex,
      chainLogosCount: account.chainLogosCount,
    })
  })

  it('Verify that a click on a single-chain account row opens that Safe dashboard with URL and header', () => {
    space.verifySpaceDashboardWidgetVisible('Accounts')
    const row = staticSpaces.dashboardWithSafes.pendingTxAccount

    space.clickAccountItemByIndex(staticSpaces.dashboardWithSafes.singleChainAccountRowIndex)

    space.verifyOpenedSafeDashboardFromSpaceAccountsRow({
      safeFullQuery: row.safeUrlParam,
      expectedName: row.name,
      fullAddress: row.address,
      chainShortName: row.chainShortName,
      balanceRegex: space.nonZeroBalanceRegex,
      ownersThreshold: row.ownersThreshold,
    })
  })

  it('Verify that a click on a multichain account row expands the row with one sub-account per chain', () => {
    space.verifySpaceDashboardWidgetVisible('Accounts')
    const rowIndex = staticSpaces.dashboardWithSafes.multichainAccountRowIndex

    space.clickAccountItemByIndex(rowIndex)
    space.verifyAccountExpandedPanelVisible(rowIndex)
    space.verifyExpandedPanelSubAccountRowsCount(rowIndex, staticSpaces.dashboardWithSafes.multichainSubAccounts.length)
  })

  it('Verify that a click on an expanded sub-account row opens the Safe on the correct network', () => {
    space.verifySpaceDashboardWidgetVisible('Accounts')
    const rowIndex = staticSpaces.dashboardWithSafes.multichainAccountRowIndex
    const sub = staticSpaces.dashboardWithSafes.multichainSubAccounts[1]

    space.clickAccountItemByIndex(rowIndex)
    space.clickExpandedPanelSubAccountRow(rowIndex, 1)
    space.verifySafeUrlIncludesParam(sub.safeQueryIncludes)
  })

  it('Verify that clicking View all accounts in the Accounts widget opens the Accounts tab of the Space', () => {
    space.verifySpaceDashboardWidgetVisible('Accounts')
    space.clickViewAllAccounts()
    space.verifyViewAllAccountsPageOpened(staticSpaces.dashboardWithSafes.safeAccountsPageCount)
  })

  // ===========================================
  // Space-level Sidebar Navigation
  // ===========================================

  describe('Space-level Sidebar', () => {
    it('Verify that clicking each Space-level sidebar item navigates to the correct page', () => {
      space.verifySidebarItemNavigates(space.sidebarItemAccounts, '/spaces/safe-accounts')
      space.verifySidebarItemNavigates(space.sidebarItemAddressBook, '/spaces/address-book')
      space.verifySidebarItemNavigates(space.sidebarItemTeam, '/spaces/members')
      space.verifySidebarItemNavigates(space.sidebarItemSettings, '/spaces/settings')
      space.verifySidebarItemNavigates(space.sidebarItemHome, '/spaces')
    })

    it('Verify that the sidebar correctly switches from Space-level to Safe-level navigation when entering a Safe', () => {
      const safeData = staticSpaces.dashboardWithSafes.pendingTxAccount

      // Precondition: space sidebar is visible
      space.verifySpaceSidebarItemsVisible()
      // Action: click on a safe in the accounts widget
      space.verifySpaceDashboardWidgetVisible('Accounts')
      space.clickAccountItemByIndex(staticSpaces.dashboardWithSafes.singleChainAccountRowIndex)
      space.verifySpaceSidebarItemsNotVisible()
      space.verifySafeLevelNavigationElements()
    })
  })

  // ===========================================
  // Space Selector
  // ===========================================

  describe('Space Selector', () => {
    it('Verify that the Space selector dropdown lists all Spaces belonging to the user', () => {
      space.clickOnSpaceSelector()

      space.verifySpaceSelectorMenuVisible()
      space.verifySpaceSelectorContainsSpaces([
        staticSpaces.dashboardWithSafes.name,
        staticSpaces.emptyGettingStarted.name,
      ])
    })
  })
})

/*
Safe Selector through Spaces empty dashboard: commented out; remove this block comment to restore.

  // ===========================================
  // Safe Selector
  // ===========================================

  describe('Safe Selector', () => {
    it('Verify that the Safe selector shows all Safes in the current Space', () => {
      space.verifySpaceDashboardWidgetVisible('Accounts')
      space.verifySpaceDashboardAccountsWidgetRowCount(staticSpaces.dashboardWithSafes.accountsWidgetRowCount)
    })

    it('Verify that the Back to Space button is visible in the Safe selector and returns the user to Space Home', () => {
      space.verifySpaceDashboardWidgetVisible('Accounts')
      space.clickAccountItemByIndex(0)
      space.verifyUrlIncludesPath('/home')

      cy.get(space.backToSpaceBtn).should('be.visible').click()
      space.verifyUrlIncludesPath('/spaces')
    })
  })

  // ===========================================
  // Pending Transactions Widget
  // ===========================================

  describe('Pending Transactions Widget', () => {
    it('Verify that the Pending Transactions widget shows pending tx summary for all Safes in the current Space', () => {
      space.verifySpaceDashboardWidgetVisible('Pending')
      main.verifyElementsCount(`${space.pendingTxWidget} ${space.widgetItem}`, 2)
    })

    it('Verify that pending tx item at index 1 shows correct name and status', () => {
      space.verifySpaceDashboardWidgetVisible('Pending')
      cy.get(space.getPendingTxItem(1))
        .should('be.visible')
        .and('contain.text', space.pendingTxName)
        .and('contain.text', space.pendingTxStatus)
      cy.get(space.getPendingTxItem(1)).find('svg').should('exist')
    })

    it('Verify that clicking a pending transaction in the widget routes to the relevant Safe-level page for action or review', () => {
      space.verifySpaceDashboardWidgetVisible('Pending')
      cy.get(space.getPendingTxItem(0)).should('be.visible').click()

      cy.contains(space.txDetailsLabel).should('be.visible')
      space.verifyUrlIncludesPath('/transactions/tx')
    })

    it('Verify that each pending transaction displays a Safe identicon', () => {
      space.verifySpaceDashboardWidgetVisible('Pending')
      cy.get(space.getPendingTxItem(0)).find('img').should('exist')
      cy.get(space.getPendingTxItem(1)).find('img').should('exist')
    })
  })

  // ===========================================
  // Deep Links & Routing
  // ===========================================

  describe('Deep Links & Routing', () => {
    it('Verify that a direct Safe URL loads without SIWE and without Space context', () => {
      cy.visit('/home?safe=sep:0x1694CbDE1b30eEdd9f7A2b6C7e36A180F2a3a23C7')

      cy.contains('Transactions').should('be.visible')
      space.verifySafeUrlIncludesParam('sep:0x1694CbDE1b30eEdd9f7A2b6C7e36A180F2a3a23C7')
      space.verifySpaceSidebarItemsNotVisible()
    })

    it('Verify that accessing the app without being logged in redirects to the welcome page', () => {
      cy.clearAllCookies()
      cy.clearAllLocalStorage()
      space.visitSpaceDashboard(staticSpaces.dashboardWithSafes.id)

      cy.contains('Welcome').should('be.visible')
      space.verifyUrlIncludesPath('/welcome')
    })
  })

  // ===========================================
  // Disconnect
  // ===========================================

  describe('Disconnect', () => {
    it('Verify that disconnect in the top bar clears session and routes user to the Welcome page', () => {
      space.verifySpaceDashboardWidgetVisible('Accounts')

      space.disconnectFromSpaceLevel()

      cy.contains('Welcome').should('be.visible')
      space.verifyUrlIncludesPath('/welcome')
    })
  })

describe('Spaces empty dashboard tests', () => {
  beforeEach(() => {
    cy.visit(constants.spacesUrl)
    wallet.connectSigner(owner)
    space.clickOnSignInBtn()
    space.visitSpaceDashboard(staticSpaces.emptyGettingStarted.id)
  })

  describe('Empty State - Getting Started', () => {
    it('Verify that the empty Space dashboard displays the Getting started page', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.contains(space.addSafeAccountsLabel).should('be.visible')
    })

    it('Verify that the Accounts widget shows an empty state when no Safes are in the Space', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.dashboardSafeList).should('not.exist')
    })

    it('Verify that clicking Add account opens the add accounts flow', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.addAccountBtn).should('be.visible').click()

      cy.contains(space.addAccountsModalLabel).should('be.visible')
    })

    it('Verify that clicking Import address book opens the import dialog', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.importAddressBookBtn).should('be.visible').click()

      cy.contains(space.importAddressBookLabel).should('be.visible')
    })

    it('Verify that clicking Add members opens the add member modal', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.dashboardAddMemberBtn).should('be.visible').click()

      cy.contains(space.inviteMemberLabel).should('be.visible')
    })

    it('Verify that clicking Learn more opens the Explore spaces info modal', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.learnMoreBtn).should('be.visible').click()

      cy.contains(space.exploreSpacesLabel).should('be.visible')
    })
  })
})
*/
