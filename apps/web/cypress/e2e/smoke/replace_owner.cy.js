import * as constants from '../../support/constants'
import * as owner from '../pages/owners.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Replace Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Connected', () => {
    beforeEach(() => {
      wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    })

    it('[SMOKE] Verify that "Replace" icon is visible', () => {
      owner.verifyReplaceBtnIsEnabled()
    })

    it('[SMOKE] Verify that the owner replacement form is opened', () => {
      owner.waitForConnectionStatus()
      owner.openReplaceOwnerWindow(0)
    })
  })

  describe('Non-owner safe', () => {
    it('[SMOKE] Verify owner replace button is disabled for Non-Owner', () => {
      cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3)
      owner.verifyReplaceBtnIsDisabled()
    })
  })
})
