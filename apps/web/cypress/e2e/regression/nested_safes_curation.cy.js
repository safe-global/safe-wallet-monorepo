import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

/**
 * Test Configuration
 * Adjust these values when using a different test safe:
 * - TOTAL_NESTED_SAFES: Total number of nested safes the parent safe has
 * - SUSPICIOUS_SAFES_COUNT: Number of suspicious nested safes (with warning icons)
 * - MAX_DISPLAY_COUNT: Maximum safes shown before "Show all" link (UI limit)
 *
 * Flow:
 * - First-time: Opens intro screen explaining nested safes (can be dismissed)
 * - User clicks "Review Nested Safes" to enter manage mode
 * - In manage mode: Shows ALL safes, NONE are pre-selected
 * - User must manually select which safes they want to see
 * - After curation: Opens in normal view showing only selected safes
 * - Normal view shows "+X more nested safes found" indicator if uncurated safes exist
 * - Re-entering manage: Shows all safes again with Cancel/Save buttons
 */
const TEST_CONFIG = {
  TOTAL_NESTED_SAFES: 8,
  SUSPICIOUS_SAFES_COUNT: 2,
  MAX_DISPLAY_COUNT: 5,
  get VALID_SAFES_COUNT() {
    return this.TOTAL_NESTED_SAFES - this.SUSPICIOUS_SAFES_COUNT
  },
}

describe('Nested safes curation tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    // Use larger viewport to ensure all safes are visible in manage mode
    cy.viewport(1400, 1400)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_46)
  })

  describe('First-time curation flow', () => {
    it('Verify first-time visit shows intro screen with close button', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()

      // First-time flow: intro screen is shown
      nsafes.verifyIntroScreenVisible()
      // Manage button should NOT be visible on intro screen
      nsafes.verifyManageBtnNotExists()
      // Close button should be visible (user can dismiss and review later)
      nsafes.verifyCloseButtonVisible()
    })

    it('Verify closing intro screen and reopening shows intro again', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()

      // Close the popover without completing curation
      nsafes.closePopover()
      nsafes.verifyPopoverClosed()

      // Re-open - should show intro screen again (curation not complete)
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()
      nsafes.verifyIntroScreenVisible()
    })

    it('Verify clicking Review Nested Safes opens manage mode', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()
      nsafes.clickReviewNestedSafesBtn()

      // After clicking review: manage mode is active, shows ALL safes
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)
      // NO safes are pre-selected on first visit
      nsafes.verifySelectedSafesCount(0)
      // Suspicious safes have warning icons
      nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)
      // Both Cancel and Confirm selection buttons should be visible
      nsafes.verifySaveAndCancelBtnsExist()
    })

    it('Verify user can select safes and confirm curation', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()
      nsafes.clickReviewNestedSafesBtn()

      // Initially no safes selected
      nsafes.verifySelectedSafesCount(0)

      // Select a valid safe (one without warning icon)
      nsafes.clickFirstValidSafeCheckbox()
      nsafes.verifySelectedSafesCount(1)

      // Confirm selection
      nsafes.clickOnSaveManageBtn()

      // After curation: normal view shows only selected safe
      nsafes.verifyVisibleNestedSafesCount(1)
      // No warning icons in normal view (we selected a valid safe)
      nsafes.verifyWarningIconCount(0)
      // Manage button should be visible
      nsafes.verifyManageBtnExists()
    })

    it('Verify suspicious safes have warning icons in manage mode', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()
      nsafes.clickReviewNestedSafesBtn()

      // All safes visible in manage mode
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)
      // Suspicious safes have warning icons
      nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)
    })
  })

  describe('After curation completed', () => {
    beforeEach(() => {
      // Complete first-time curation by selecting one valid safe
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForIntroScreenToLoad()
      nsafes.clickReviewNestedSafesBtn()
      nsafes.clickFirstValidSafeCheckbox()
      nsafes.clickOnSaveManageBtn()
      // After save, popover stays open in normal view - close it so tests can start fresh
      nsafes.closePopover()
      nsafes.verifyPopoverClosed()
    })

    it('Verify normal view shows only selected safes without warning icons', () => {
      // Re-open the list
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      // Only the one safe we selected should be visible
      nsafes.verifyVisibleNestedSafesCount(1)
      nsafes.verifyWarningIconCount(0)
      nsafes.verifyManageBtnExists()
    })

    it('Verify +X more nested safes indicator appears when uncurated safes exist', () => {
      // Re-open the list
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      // We selected 1 safe, so there should be (TOTAL - 1) more
      const expectedMoreCount = TEST_CONFIG.TOTAL_NESTED_SAFES - 1
      nsafes.verifyMoreIndicatorVisible(expectedMoreCount)
    })

    it('Verify clicking +X more indicator opens manage mode', () => {
      // Re-open the list
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      // Click the "+X more" indicator
      nsafes.clickMoreIndicator()

      // Should now be in manage mode with all safes visible
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)
      nsafes.verifySaveAndCancelBtnsExist()
    })

    it('Verify re-entering manage mode shows all safes again', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      nsafes.clickOnManageNestedSafesBtn()
      nsafes.waitForEditModeToLoad()

      // All safes visible again
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)
      // Warning icons visible
      nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)
      // Both Cancel and Save buttons exist
      nsafes.verifySaveAndCancelBtnsExist()
      // The one safe we selected earlier should still be selected
      nsafes.verifySelectedSafesCount(1)
    })

    it('Verify canceling manage mode discards changes', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      nsafes.clickOnManageNestedSafesBtn()
      nsafes.waitForEditModeToLoad()

      // Select another valid safe
      nsafes.clickFirstValidSafeCheckbox() // Toggles - might deselect our existing one

      // Cancel - changes should be discarded
      nsafes.clickOnCancelManageBtn()

      // Back to normal view with original count (1 safe)
      nsafes.verifyVisibleNestedSafesCount(1)
    })

    it('Verify selecting more safes adds them to normal view', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      nsafes.clickOnManageNestedSafesBtn()
      nsafes.waitForEditModeToLoad()

      // Currently 1 safe selected, select another valid safe
      nsafes.verifySelectedSafesCount(1)
      // Click on a different valid safe (second one)
      cy.get('[data-testid="nested-safe-list"]')
        .find('[data-testid="safe-list-item"]')
        .filter(':not(:has([data-testid="suspicious-safe-warning"]))')
        .eq(1)
        .find('input[type="checkbox"]')
        .click()
      nsafes.verifySelectedSafesCount(2)

      nsafes.clickOnSaveManageBtn()

      // Two safes should now be visible
      nsafes.verifyVisibleNestedSafesCount(2)
    })

    it('Verify curation persists after page reload', () => {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()
      nsafes.verifyVisibleNestedSafesCount(1)

      cy.reload()

      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      // Still shows curated view (not first-time flow)
      nsafes.verifyVisibleNestedSafesCount(1)
      nsafes.verifyManageBtnExists()
    })
  })
})
