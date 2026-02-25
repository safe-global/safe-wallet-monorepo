import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createtx from '../../e2e/pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const currentNonce = 5

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Create transactions tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.ensureSiweSession(signer)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_10)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
  })

  it('[SMOKE] Verify MaxAmount button', () => {
    createtx.setMaxAmount()
    createtx.verifyMaxAmount(constants.tokenNames.sepoliaEther, constants.tokenAbbreviation.sep)
  })

  it('[SMOKE] Verify error messages for invalid address input', () => {
    createtx.verifyRandomStringAddress('Lorem Ipsum')
    createtx.verifyWrongChecksum(constants.WRONGLY_CHECKSUMMED_ADDRESS)
  })

  it('[SMOKE] Verify address input resolves a valid ENS name', () => {
    createtx.typeRecipientAddress(constants.ENS_TEST_SEPOLIA)
    createtx.verifyENSResolves(staticSafes.SEP_STATIC_SAFE_6)
  })

  it('[SMOKE] Verify error message for invalid amount input', () => {
    createtx.clickOnTokenselectorAndSelectSepoliaEth()
    createtx.verifyAmountLargerThanCurrentBalance()
  })

  it('[SMOKE] Verify nonce tooltip warning messages', () => {
    createtx.changeNonce(0)
    createtx.verifyTooltipMessage(constants.nonceTooltipMsg.lowerThanCurrent + currentNonce.toString())
    createtx.changeNonce(currentNonce + 53)
    createtx.verifyTooltipMessage(constants.nonceTooltipMsg.higherThanRecommended)
    createtx.changeNonce(currentNonce + 150)
    createtx.verifyTooltipMessage(constants.nonceTooltipMsg.muchHigherThanRecommended)
  })
})
