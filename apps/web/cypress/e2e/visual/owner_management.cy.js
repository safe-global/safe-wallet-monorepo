import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as wallet from '../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe(
  '[VISUAL] Owner management screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      wallet.connectSigner(signer)
      cy.contains('Required confirmations', { timeout: 30000 }).should('be.visible')
    })

    it('[VISUAL] Screenshot add new signer form', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      main.waitForMuiAnimationsToSettle()
      cy.contains('Add new signer', { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })

    it('[VISUAL] Screenshot add signer with invalid address error', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      main.waitForMuiAnimationsToSettle()
      owner.typeOwnerAddressManage(1, main.generateRandomString(10))
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)
      main.verifySkeletonsGone()
    })

    it('[VISUAL] Screenshot replace signer dialog', () => {
      owner.openReplaceOwnerWindow(0)
      main.waitForMuiAnimationsToSettle()
      cy.contains('Replace signer', { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
