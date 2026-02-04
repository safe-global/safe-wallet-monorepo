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
  MAX_DISPLAY_COUNT: 5,
  get VALID_SAFES_COUNT() {
    return this.TOTAL_NESTED_SAFES - this.SUSPICIOUS_SAFES_COUNT
  },
  get INITIAL_VISIBLE_COUNT() {
    return Math.min(this.VALID_SAFES_COUNT, this.MAX_DISPLAY_COUNT)
  },
}

describe('Nested safes curation tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_46)
  })

  it('Verify that suspicious nested safes are hidden by default', () => {
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.INITIAL_VISIBLE_COUNT)
    nsafes.verifyHiddenSafesCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)
    nsafes.verifyManageBtnExists()
  })

  it('Verify that Show all Nested Safes link appears when more than 5 visible safes', () => {
    if (TEST_CONFIG.VALID_SAFES_COUNT > TEST_CONFIG.MAX_DISPLAY_COUNT) {
      sideBar.clickOnOpenNestedSafeListBtn()
      nsafes.waitForNestedSafeListToLoad()

      nsafes.verifyShowAllNestedSafesVisible()
      nsafes.clickShowAllNestedSafes()
      nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.VALID_SAFES_COUNT)
    }
  })

  it('Verify that entering edit mode shows all safes including suspicious ones', () => {
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.verifySaveAndCancelBtnsExist()
    nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)
    nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.TOTAL_NESTED_SAFES)
    nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

    nsafes.clickOnCancelManageBtn()
    nsafes.verifySaveAndCancelBtnsNotExist()
    nsafes.verifyVisibleNestedSafesCount(TEST_CONFIG.INITIAL_VISIBLE_COUNT)
  })

  it('Verify that canceling edit mode discards changes', () => {
    const initialVisibleCount = TEST_CONFIG.INITIAL_VISIBLE_COUNT

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.clickFirstValidSafeCheckbox()
    nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT + 1)

    nsafes.clickOnCancelManageBtn()
    nsafes.verifySaveAndCancelBtnsNotExist()
    nsafes.verifyVisibleNestedSafesCount(initialVisibleCount)
  })

  it('Verify that hiding a valid safe removes it from the default view', () => {
    const initialHiddenCount = TEST_CONFIG.SUSPICIOUS_SAFES_COUNT
    const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT - 1
    const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.clickFirstValidSafeCheckbox()
    nsafes.verifySelectedToHideCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT + 1)

    nsafes.clickOnSaveManageBtn()
    nsafes.verifySaveAndCancelBtnsNotExist()

    nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
    nsafes.verifyHiddenSafesCount(initialHiddenCount + 1)
  })

  it('Verify that unhiding a suspicious safe adds it to the default view', () => {
    const initialHiddenCount = TEST_CONFIG.SUSPICIOUS_SAFES_COUNT
    const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT + 1
    const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.clickFirstSuspiciousSafeCheckbox()

    nsafes.clickOnSaveManageBtn()
    nsafes.verifySaveAndCancelBtnsNotExist()

    nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
    nsafes.verifyHiddenSafesCount(initialHiddenCount - 1)
  })

  it('Verify that suspicious safes show warning icon in edit mode', () => {
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.verifyWarningIconCount(TEST_CONFIG.SUSPICIOUS_SAFES_COUNT)

    nsafes.clickOnCancelManageBtn()
  })

  it('Verify that warning icons are not shown in normal view', () => {
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.verifyWarningIconCount(0)
  })

  it('Verify that hidden safes remain hidden after page reload', () => {
    const newValidCount = TEST_CONFIG.VALID_SAFES_COUNT - 1
    const expectedVisibleAfter = Math.min(newValidCount, TEST_CONFIG.MAX_DISPLAY_COUNT)

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.clickOnManageNestedSafesBtn()
    nsafes.waitForEditModeToLoad()

    nsafes.clickFirstValidSafeCheckbox()

    nsafes.clickOnSaveManageBtn()
    nsafes.verifySaveAndCancelBtnsNotExist()

    nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)

    cy.reload()

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.waitForNestedSafeListToLoad()

    nsafes.verifyVisibleNestedSafesCount(expectedVisibleAfter)
  })
})
