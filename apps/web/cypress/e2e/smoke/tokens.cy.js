import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

let staticSafes = []

describe('[SMOKE] Tokens tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  beforeEach(() => {
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__tokenlist_onboarding,
      ls.cookies.acceptedTokenListOnboarding,
    )
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  // Added to prod
  it('Verify that when owner is disconnected, Send button is disabled', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
