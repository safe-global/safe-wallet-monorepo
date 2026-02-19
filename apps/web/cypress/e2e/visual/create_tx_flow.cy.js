import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as wallet from '../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

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
      mockVisualTestApis()
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_10)
      wallet.connectSigner(signer)
      createtx.clickOnNewtransactionBtn()
      createtx.clickOnSendTokensBtn()
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot send form initial state', () => {
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot send form with filled recipient and amount', () => {
      createtx.typeRecipientAddress(constants.RECIPIENT_ADDRESS)
      createtx.clickOnTokenselectorAndSelectToken('Ether')
      createtx.setMaxAmount()
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot send form validation errors for invalid address', () => {
      createtx.typeRecipientAddress('Lorem Ipsum')
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot send form with nonce warning', () => {
      createtx.changeNonce(0)
      main.awaitVisualStability()
    })
  },
)
