import * as constants from '../../support/constants.js'
import * as space from '../pages/spaces.page.js'
import * as main from '../pages/main.page.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
// Use OWNER_1 for static space tests to avoid conflicts with OWNER_4 used in spaces_basicflow.cy.js
const owner = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Spaces dashboard tests', () => {
  beforeEach(() => {
    cy.visit(constants.spacesUrl)
    wallet.connectSigner(owner)
    space.loginWithSiwe()
    cy.visit(constants.spaceDashboardUrl + space.testSpaceId)
  })

  // ===========================================
  // SIWE Authentication
  // ===========================================

  describe('SIWE Authentication', () => {
    it('Verify that a user can successfully sign in using SIWE with a supported wallet', () => {
      // The beforeEach already performs SIWE login; verify we are in a Space context
      cy.url().should('include', '/spaces')
      cy.url().should('include', 'spaceId=')
    })

    it('Verify that after SIWE login the user lands in the correct Space context', () => {
      space.verifyWidgetVisible('Accounts')
      space.verifyWidgetVisible('Pending')
    })
  })

  // ===========================================
  // Spaces Dashboard
  // ===========================================

  describe('Spaces Dashboard', () => {
    it('Verify that the Space dashboard loads correctly after login for a user with an existing Space and Safes', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.dashboardSafeList).find(space.widgetItem).should('have.length.at.least', 1)
      space.verifyWidgetVisible('Pending')
    })

    it('Verify that the Space dashboard header displays the current Space name', () => {
      cy.contains(space.testSpaceName).should('be.visible')
    })
  })

  // ===========================================
  // Accounts Widget
  // ===========================================

  describe('Accounts Widget', () => {
    it('Verify that the Accounts widget lists all Safes associated with the current Space', () => {
      space.verifyWidgetVisible('Accounts')
      main.verifyMinimumElementsCount(`${space.dashboardSafeList} ${space.widgetItem}`, 1)
    })

    it('Verify that the first account has no name and displays the address', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(0))
        .should('be.visible')
        .and('contain.text', space.firstAccountAddress)
        .and('not.contain.text', space.secondAccountName)
    })

    it('Verify that the second account has the correct name', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(1))
        .should('be.visible')
        .and('contain.text', space.secondAccountName)
        .and('contain.text', space.secondAccountAddress)
    })

    it('Verify that the first account displays chain logos', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(0)).should('be.visible').find('img').should('have.length', 2)
    })

    it('Verify that clicking a Safe in the Accounts widget navigates to that Safe dashboard with Space context', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(0)).click()
      cy.url().should('include', '/home').and('include', 'safe=')
    })

    it('Verify that clicking View all accounts in the Accounts widget opens the Accounts tab of the Space', () => {
      space.verifyWidgetVisible('Accounts')
      cy.contains(space.viewAllAccountsLabel).click()
      cy.url().should('include', '/spaces/safe-accounts').and('include', 'spaceId=')
    })
  })

  // ===========================================
  // Space-level Sidebar Navigation
  // ===========================================

  describe('Space-level Sidebar', () => {
    it('Verify that clicking each Space-level sidebar item navigates to the correct page', () => {
      // Accounts
      space.verifySidebarItemNavigates(space.sidebarItemAccounts, '/spaces/safe-accounts')
      cy.url().should('include', 'spaceId=')

      // Address book
      space.verifySidebarItemNavigates(space.sidebarItemAddressBook, '/spaces/address-book')
      cy.url().should('include', 'spaceId=')

      // Team
      space.verifySidebarItemNavigates(space.sidebarItemTeam, '/spaces/members')
      cy.url().should('include', 'spaceId=')

      // Settings
      space.verifySidebarItemNavigates(space.sidebarItemSettings, '/spaces/settings')
      cy.url().should('include', 'spaceId=')

      // Home (back to dashboard)
      space.verifySidebarItemNavigates(space.sidebarItemHome, '/spaces')
      cy.url().should('include', 'spaceId=')
    })

    it('Verify that the sidebar correctly switches from Space-level to Safe-level navigation when entering a Safe', () => {
      // Space-level sidebar should be visible
      cy.get(space.sidebarItemAccounts).should('be.visible')
      cy.get(space.sidebarItemTeam).should('be.visible')

      // Navigate to a Safe
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(0)).click()
      // Wait for Safe dashboard to load
      cy.contains('Transactions').should('be.visible')
      cy.url().should('include', '/home')

      // Space-level sidebar items should no longer be visible
      cy.get(space.sidebarItemAccounts).should('not.exist')
      cy.get(space.sidebarItemTeam).should('not.exist')

      // Back to space button should be visible
      cy.get(space.backToSpaceBtn).should('be.visible')
    })
  })

  // ===========================================
  // Space Selector
  // ===========================================

  describe('Space Selector', () => {
    it('Verify that the Space selector dropdown lists all Spaces belonging to the user', () => {
      space.clickOnSpaceSelector()
      cy.get(space.spaceSelectorMenu).should('be.visible')
      cy.get(space.spaceSelectorMenu).find('li').should('have.length.at.least', 1)
    })
  })

  // ===========================================
  // Safe Selector
  // ===========================================

  describe('Safe Selector', () => {
    it('Verify that the Safe selector shows all Safes in the current Space', () => {
      space.verifyWidgetVisible('Accounts')
      main.verifyElementsCount(`${space.dashboardSafeList} ${space.widgetItem}`, 2)
    })

    it('Verify that the Back to Space button is visible in the Safe selector and returns the user to Space Home', () => {
      space.verifyWidgetVisible('Accounts')
      cy.get(space.getAccountItem(0)).click()
      cy.url().should('include', '/home')

      cy.get(space.backToSpaceBtn).should('be.visible').click()
      cy.url().should('include', '/spaces').and('include', 'spaceId=')
    })
  })

  // ===========================================
  // Pending Transactions Widget
  // ===========================================

  describe('Pending Transactions Widget', () => {
    it('Verify that the Pending Transactions widget shows pending tx summary for all Safes in the current Space', () => {
      cy.get(space.pendingTxWidget, { timeout: 30000 }).should('be.visible')
      main.verifyElementsCount(`${space.pendingTxWidget} ${space.widgetItem}`, 2)
    })

    it('Verify that pending tx item at index 1 shows correct name and status', () => {
      cy.get(space.pendingTxWidget, { timeout: 30000 }).should('be.visible')
      cy.get(space.getPendingTxItem(1))
        .should('be.visible')
        .and('contain.text', space.pendingTxName)
        .and('contain.text', space.pendingTxStatus)
      cy.get(space.getPendingTxItem(1)).find('svg').should('exist')
    })

    it('Verify that clicking a pending transaction in the widget routes to the relevant Safe-level page for action or review', () => {
      cy.get(space.pendingTxWidget, { timeout: 30000 }).should('be.visible')
      cy.get(space.getPendingTxItem(0)).should('be.visible').click()

      // Wait for the tx details page to load
      cy.contains(space.txDetailsLabel).should('be.visible')
      cy.url().should('include', '/transactions/tx').and('include', 'safe=')
      cy.contains(space.pendingTxBatchLabel).should('be.visible')
    })

    it('Verify that each pending transaction displays a Safe identicon', () => {
      cy.get(space.pendingTxWidget, { timeout: 30000 }).should('be.visible')
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
      // Wait for the Safe dashboard to load
      cy.contains('Transactions').should('be.visible')
      cy.url().should('include', '/home').and('include', 'safe=')

      cy.get(space.sidebarItemAccounts).should('not.exist')
      cy.get(space.sidebarItemTeam).should('not.exist')
    })

    it('Verify that accessing the app without being logged in redirects to the welcome page', () => {
      cy.clearAllCookies()
      cy.clearAllLocalStorage()
      cy.visit('/spaces?spaceId=' + space.testSpaceId)
      // Wait for the welcome page to load
      cy.contains('Welcome').should('be.visible')
      cy.url().should('include', '/welcome')
    })
  })

  // ===========================================
  // Disconnect
  // ===========================================

  describe('Disconnect', () => {
    it('Verify that disconnect in the top bar clears session and routes user to the Welcome page', () => {
      space.verifyWidgetVisible('Accounts')

      // Click wallet button in Spaces header, then Disconnect
      space.disconnectFromSpaceLevel()

      // Wait for welcome page to load
      cy.contains('Welcome').should('be.visible')
      cy.url().should('include', '/welcome')
    })
  })
})

describe('Spaces empty dashboard tests', () => {
  beforeEach(() => {
    cy.visit(constants.spacesUrl)
    wallet.connectSigner(owner)
    space.loginWithSiwe()
    cy.visit(constants.spaceDashboardUrl + space.emptySpaceId)
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

      // The fullscreen add accounts modal should open
      cy.contains(space.addAccountsModalLabel).should('be.visible')
    })

    it('Verify that clicking Import address book opens the import dialog', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.importAddressBookBtn).should('be.visible').click()

      // The import address book dialog should open
      cy.contains(space.importAddressBookLabel).should('be.visible')
    })

    it('Verify that clicking Add members opens the add member modal', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.dashboardAddMemberBtn).should('be.visible').click()

      // The add member modal should open
      cy.contains(space.inviteMemberLabel).should('be.visible')
    })

    it('Verify that clicking Learn more opens the Explore spaces info modal', () => {
      cy.contains(space.gettingStartedLabel).should('be.visible')
      cy.get(space.learnMoreBtn).should('be.visible').click()

      // The spaces info modal should open
      cy.contains(space.exploreSpacesLabel).should('be.visible')
    })
  })
})
