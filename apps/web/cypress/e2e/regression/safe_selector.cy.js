import * as constants from '../../support/constants'
import * as safeNav from '../pages/safe_navigation.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import safes from '../../fixtures/safes/static.js'

let staticSafes = []

describe('Safe selector tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
  })

  it('Verify current safe details are shown in the safe selector trigger', () => {
    safeNav.verifySafeIconVisible()
    safeNav.verifySafeSelectorTriggerAddress(safes.SEP_STATIC_SAFE_9_SHORT)
    safeNav.verifySafeSelectorThreshold(2, 2)
  })
})
