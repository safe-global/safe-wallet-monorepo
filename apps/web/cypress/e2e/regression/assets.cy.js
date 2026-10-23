import * as constants from '../../support/constants'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []

let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Assets tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Disconnected', () => {
    beforeEach(() => {
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    })

    it('Verify that "Hide token" button is present and opens the "Hide tokens menu"', () => {
      assets.toggleShowAllTokens(true)
      assets.toggleHideDust(false)
      assets.openHiddenTokensFromManageMenu()
      assets.verifyEachRowHasCheckbox()
    })
  })

  describe('Connected', () => {
    it('Verify that clicking the button with an owner opens the Send funds form', () => {
      wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
      assets.toggleShowAllTokens(true)
      assets.toggleHideDust(false)
      cy.wait(2000)
      assets.clickOnSendBtnAssetsTable(0)
    })
  })
})
