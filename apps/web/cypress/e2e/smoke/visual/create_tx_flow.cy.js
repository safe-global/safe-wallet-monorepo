import * as constants from '../../../support/constants.js'
import * as createtx from '../../pages/create_tx.pages.js'
import * as wallet from '../../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../../support/safes/safesHandler.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Create transaction flow tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_10)
    wallet.connectSigner(signer)
  })

  it('[SMOKE] Verify that the send form initial state is displayed', () => {
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    cy.contains('Recipient address', { timeout: 10000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the send form with filled recipient and amount is displayed', () => {
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.RECIPIENT_ADDRESS)
    createtx.clickOnTokenselectorAndSelectSepoliaEth()
    createtx.setMaxAmount()
    createtx.verifyMaxAmount(constants.tokenNames.sepoliaEther, constants.tokenAbbreviation.sep)
  })

  it('[SMOKE] Verify that the send form shows validation errors for invalid address', () => {
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.verifyRandomStringAddress('Lorem Ipsum')
  })
})
