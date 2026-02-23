import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as spendinglimit from '../pages/spending_limits.pages.js'
import * as owner from '../pages/owners.pages.js'
import * as wallet from '../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[VISUAL] Spending limits screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
    cy.get(spendinglimit.spendingLimitsSection).should('be.visible')
    spendinglimit.clickOnNewSpendingLimitBtn()
    main.waitForMuiAnimationsToSettle()
    cy.contains('New transaction', { timeout: 10000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot spending limit form', () => {
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spending limit amount validation error', () => {
    spendinglimit.enterSpendingLimitAmount('0')
    spendinglimit.verifyNumberErrorValidation()
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot spending limit reset time dropdown', () => {
    spendinglimit.clickOnTimePeriodDropdown()
    main.waitForMuiAnimationsToSettle()
    spendinglimit.checkTimeDropdownOptions()
    main.verifySkeletonsGone()
  })
})
