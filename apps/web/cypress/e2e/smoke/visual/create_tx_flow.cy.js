import * as constants from '../../../support/constants.js'
import * as createtx from '../../pages/create_tx.pages.js'
import * as wallet from '../../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe(
  '[VISUAL] Create transaction flow screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_10)
      wallet.connectSigner(signer)
    })

    it('[VISUAL] Screenshot send form initial state', () => {
      createtx.clickOnNewtransactionBtn()
      createtx.clickOnSendTokensBtn()
      cy.contains('Recipient address', { timeout: 10000 }).should('be.visible')
    })

    it('[VISUAL] Screenshot send form with filled recipient and amount', () => {
      createtx.clickOnNewtransactionBtn()
      createtx.clickOnSendTokensBtn()
      createtx.typeRecipientAddress(constants.RECIPIENT_ADDRESS)
      createtx.clickOnTokenselectorAndSelectSepoliaEth()
      createtx.setMaxAmount()
      cy.contains(constants.tokenNames.sepoliaEther, { timeout: 10000 }).should('be.visible')
    })

    it('[VISUAL] Screenshot send form validation errors for invalid address', () => {
      createtx.clickOnNewtransactionBtn()
      createtx.clickOnSendTokensBtn()
      createtx.verifyRandomStringAddress('Lorem Ipsum')
    })
  },
)
