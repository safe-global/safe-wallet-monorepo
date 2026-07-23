import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as proposer from '../pages/proposers.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as assets from '../pages/assets.pages.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY
const signer3 = walletCredentials.OWNER_3_PRIVATE_KEY
const proposerAddress = '0x8eeC...2a3b'
const proposerAddress_2 = '0x0972...9f35'
const sendValue = 0.000001

describe('Proposers 2 tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify a proposers is capable of propose transactions', () => {
    wallet.connectSignerViaStorage(signer2, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_33)
    assets.toggleHideDust(false)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(getMockAddress())
    createtx.setSendValue(sendValue)
    createtx.clickOnNextBtn()
    createtx.verifySubmitBtnIsEnabled()
  })

  it('Verify a proposers cannot confirm a transaction', () => {
    wallet.connectSignerViaStorage(signer2, constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_31)
    tx.verifyTxConfirmBtnDisabled()
  })

  it('Verify a proposer cannot edit himself', () => {
    wallet.connectSignerViaStorage(signer2, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    proposer.verifyEditProposerBtnDisabled(proposerAddress)
  })

  it('Verify a proposer cannot edit or remove other proposers', () => {
    wallet.connectSignerViaStorage(signer2, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    proposer.verifyEditProposerBtnDisabled(proposerAddress_2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress_2)
  })

  it('Verify that deleting a proposer is only possible by creator', () => {
    wallet.connectSignerViaStorage(signer3, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    proposer.verifyEditProposerBtnDisabled(proposerAddress_2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress_2)
    proposer.verifyEditProposerBtnDisabled(proposerAddress)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress)
  })
})
