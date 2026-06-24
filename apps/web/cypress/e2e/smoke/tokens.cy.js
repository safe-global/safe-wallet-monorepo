import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'
import * as space from '../pages/spaces.page.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Tokens tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  beforeEach(() => {
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__tokenlist_onboarding,
      ls.cookies.acceptedTokenListOnboarding,
    )
    space.signInAndVisit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2, signer)
  })

  // Added to prod
  it('Verify that when owner is disconnected, Send button is disabled', () => {
    space.disconnectFromSpaceLevel()
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
