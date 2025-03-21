import * as constants from '../../support/constants.js'
import * as owner from '../pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as proposer from '../pages/proposers.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as tx from '../pages/transactions.page.js'
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

  it('Verify that an owner that is also a proposer can still execute transactions', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_32)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(getMockAddress())
    createtx.setSendValue(sendValue)
    createtx.clickOnNextBtn()
    tx.selectExecuteNow()
    createtx.clickOnContinueSignTransactionBtn()
    createtx.clickOnAcknowledgement()
    createtx.verifySubmitBtnIsEnabled()
  })

  it('Verify a proposers is capable of propose transactions', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    wallet.connectSigner(signer2)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(getMockAddress())
    createtx.setSendValue(sendValue)
    createtx.clickOnNextBtn()
    createtx.verifySubmitBtnIsEnabled()
  })

  it('Verify a proposers cannot confirm a transaction', () => {
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_31)
    wallet.connectSigner(signer2)
    tx.verifyTxConfirmBtnDisabled()
  })

  it('Verify a proposer cannot edit himself', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    wallet.connectSigner(signer2)
    proposer.verifyEditProposerBtnDisabled(proposerAddress)
  })

  it('Verify a proposer cannot edit or remove other proposers', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    wallet.connectSigner(signer2)
    proposer.verifyEditProposerBtnDisabled(proposerAddress_2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress_2)
  })

  it('Verify that deleting a proposer is only possible by creator', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    wallet.connectSigner(signer3)
    proposer.verifyEditProposerBtnDisabled(proposerAddress_2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress_2)
    proposer.verifyEditProposerBtnDisabled(proposerAddress)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress)
  })

  //TODO: Unskip when tenderly visibilty bug is solved
  it.skip('Verify a Tenderly simulation can be performed while proposing a tx', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_33)
    wallet.connectSigner(signer2)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtn()
    createtx.clickOnSimulateTxBtn()
    createtx.verifySuccessfulSimulation()
  })
})
