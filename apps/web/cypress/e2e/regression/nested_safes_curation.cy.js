import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

/**
 * Test Configuration
 * Adjust these values when using a different test safe:
 * - TOTAL_NESTED_SAFES: Total number of nested safes the parent safe has
 * - SUSPICIOUS_SAFES_COUNT: Number of suspicious (auto-hidden) nested safes
 * - VALID_SAFES_COUNT: Number of valid (visible by default) nested safes
 * - MAX_DISPLAY_COUNT: Maximum safes shown before "Show all" link (UI limit)
 * - INITIAL_VISIBLE_COUNT: Actual count shown initially (min of valid and max display)
 */
const TEST_CONFIG = {
  TOTAL_NESTED_SAFES: 8,
  SUSPICIOUS_SAFES_COUNT: 2,
  MAX_DISPLAY_COUNT: 5, // UI caps the list at 5 safes before requiring "Show all"
  get VALID_SAFES_COUNT() {
    return this.TOTAL_NESTED_SAFES - this.SUSPICIOUS_SAFES_COUNT
  },
  get INITIAL_VISIBLE_COUNT() {
    // Initially shows min of valid safes and max display limit
    return Math.min(this.VALID_SAFES_COUNT, this.MAX_DISPLAY_COUNT)
  },
}

describe('Nested safes curation tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_46)
    cy.wait(2000)
  })

  describe('Default visibility behavior', () => {
    it('Verify suspicious nested safes are hidden by default', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // Verify visible safes count (capped at MAX_DISPLAY_COUNT, suspicious are hidden)
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.INITIAL_VISIBLE_COUNT)

      // Verify hidden count message is displayed
      nsafes.verifyHiddenSafesCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

      // Verify manage button exists when there are nested safes
      nsafes.verifyManageBtnExists()
    })

    it('Verify "Show all Nested Safes" link appears when more than 5 visible safes', () => {
      // This test only applies when valid safes exceed the display limit
      if (TEST_CONFIG.VALID_SAFES_COUNT > TEST_CONFIG.MAX_DISPLAY_COUNT) {
        sideBar.clickOnOpenNestedSafeListBtn()
        cy.wait(1000)

        // Verify "Show all" link is visible
        nsafes.verifyShowAllNestedSafesVisible()

        // Click to show all and verify full count
        nsafes.clickShowAllNestedSafes()
        cy.wait(500)
        nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.VALID_SAFES_COUNT)
      }
    })
  })

  describe('Edit mode functionality', () => {
    it('Verify entering and exiting edit mode', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // Enter edit mode
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      // Verify edit mode UI elements
      nsafes.verifySaveAndCancelBtnsExist()
      // Suspicious safes are pre-selected (checked) to be hidden by default
      nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

      // In edit mode, all safes should be visible (including suspicious ones)
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)

      // Verify warning icons appear for suspicious safes (count should match)
      nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

      // Cancel to exit edit mode
      nsafes.clickOnCancelManageBtn()
      cy.wait(500)

      // Verify we're back to normal view (capped at MAX_DISPLAY_COUNT)
      nsafes.verifySaveAndCancelBtnsNotExist()
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.INITIAL_VISIBLE_COUNT)
    })

    it('Verify canceling edit mode discards changes', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      const initialVisibleCount = TEST_CONFIG.INITIAL_VISIBLE_COUNT

      // Enter edit mode
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      // Click on a valid safe's checkbox to mark it for hiding
      // Valid safes are unchecked by default
      cy.get('[data-testid="nested-safe-list"]')
        .find('[data-testid="safe-list-item"]')
        .filter(':not(:has([data-testid="suspicious-safe-warning"]))')
        .first()
        .find('input[type="checkbox"]')
        .click()

      // Verify selection count updated (suspicious + 1 valid now selected)
      nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT + 1)

      // Cancel changes
      nsafes.clickOnCancelManageBtn()
      cy.wait(500)

      // Verify visible safes count is unchanged (changes were discarded)
      nsafes.verifyVisibleNestedSafesCount(initialVisibleCount)
    })
  })

  describe('Hide and unhide safes', () => {
    it('Verify hiding a valid safe removes it from the default view', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      const initialHiddenCount = TEST_CONFIG.SUSPICIOUS_SAFES_COUNT
      // After hiding 1 valid safe, new valid count is VALID_SAFES_COUNT - 1
      const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT - 1
      const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

      // Enter edit mode
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      // Click on a valid safe's checkbox (one without warning icon)
      // Valid safes are unchecked by default, suspicious safes are checked
      cy.get('[data-testid="nested-safe-list"]')
        .find('[data-testid="safe-list-item"]')
        .filter(':not(:has([data-testid="suspicious-safe-warning"]))')
        .first()
        .find('input[type="checkbox"]')
        .click()

      // Verify selection count (suspicious safes + 1 valid safe now selected)
      nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT + 1)

      // Save changes
      nsafes.clickOnSaveManageBtn()
      cy.wait(500)

      // Verify visible count (capped at MAX_DISPLAY_COUNT) and hidden count increased
      nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
      nsafes.verifyHiddenSafesCount(initialHiddenCount + 1)
    })

    it('Verify unhiding a suspicious safe adds it to the default view', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      const initialHiddenCount = TEST_CONFIG.SUSPICIOUS_SAFES_COUNT
      // After unhiding 1 suspicious safe, new valid count is VALID_SAFES_COUNT + 1
      const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT + 1
      const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

      // Enter edit mode
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      // Click on a suspicious safe's checkbox (one with warning icon)
      // Suspicious safes have checkbox checked by default in edit mode (to indicate they will be hidden)
      // Clicking will uncheck it, meaning it will become visible
      cy.get('[data-testid="nested-safe-list"]')
        .find('[data-testid="safe-list-item"]')
        .filter(':has([data-testid="suspicious-safe-warning"])')
        .first()
        .find('input[type="checkbox"]')
        .click()

      // Save changes
      nsafes.clickOnSaveManageBtn()
      cy.wait(500)

      // Verify visible count (capped at MAX_DISPLAY_COUNT) and hidden count decreased
      nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
      nsafes.verifyHiddenSafesCount(initialHiddenCount - 1)
    })
  })

  describe('Suspicious safe indicators', () => {
    it('Verify suspicious safes show warning icon in edit mode', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // Enter edit mode
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      // Verify warning icons exist for suspicious safes
      nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

      // Exit edit mode
      nsafes.clickOnCancelManageBtn()
    })

    it('Verify warning icons not shown in normal view', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // In normal view, no warning icons should be visible
      // (suspicious safes are hidden, so their warnings aren't visible)
      nsafes.verifyWarningIconCount(0)
    })
  })

  describe('Persistence tests', () => {
    it('Verify hidden safes remain hidden after page reload', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // After hiding 1 valid safe, calculate expected visible count
      const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT - 1
      const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

      // Enter edit mode and hide a valid safe
      nsafes.clickOnManageNestedSafesBtn()
      cy.wait(500)

      cy.get('[data-testid="nested-safe-list"]')
        .find('[data-testid="safe-list-item"]')
        .filter(':not(:has([data-testid="suspicious-safe-warning"]))')
        .first()
        .find('input[type="checkbox"]')
        .click()

      nsafes.clickOnSaveManageBtn()
      cy.wait(500)

      // Verify change took effect
      nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)

      // Reload page
      cy.reload()
      cy.wait(2000)

      // Open nested safes list again
      sideBar.clickOnOpenNestedSafeListBtn()
      cy.wait(1000)

      // Verify the safe is still hidden after reload
      nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
    })
  })
})
