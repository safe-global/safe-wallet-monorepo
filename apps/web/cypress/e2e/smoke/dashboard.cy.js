import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Dashboard tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[SMOKE] Verify the overview widget is displayed', () => {
    dashboard.verifyOverviewWidgetData()
  })

  it('[SMOKE] Verify the transaction queue widget is displayed', () => {
    dashboard.verifyTxQueueWidget()
  })

  it('[SMOKE] Verify the Safe Apps Section is displayed', () => {
    dashboard.verifyExplorePossibleSection()
  })
})
