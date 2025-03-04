import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as data from '../../fixtures/txhistory_data_data.json'

let staticSafes,
  fundsSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const typeBulkTx = data.type.bulkTransaction

describe('Bulk execution', () => {
  before(() => {
    getSafes(CATEGORIES.funds)
      .then((funds) => {
        fundsSafes = funds
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })

  it('Verify that Bulk Execution is available for a few fully signed txs located one by one', () => {
    cy.visit(constants.transactionQueueUrl + fundsSafes.SEP_FUNDS_SAFE_14)
    main.acceptCookies()
    wallet.connectSigner(signer)
    create_tx.verifyBulkExecuteBtnIsEnabled(2)
    create_tx.verifyEnabledBulkExecuteBtnTooltip()
  })

  it(
    'Verify that "Confirm bulk execution" screen contains only available for execution txs in the actions list',
    { defaultCommandTimeout: 30000 },
    () => {
      const actions = ['1transfer', '2removeOwner']

      cy.visit(constants.transactionQueueUrl + fundsSafes.SEP_FUNDS_SAFE_14)
      wallet.connectSigner(signer)
      main.acceptCookies()
      create_tx.verifyBulkExecuteBtnIsEnabled(2).click()
      create_tx.verifyBulkConfirmationScreen(2, actions)
    },
  )

  it(
    'Verify bulk view for the txs with the same tx hash in the History (tx executed via bulk feature)',
    { defaultCommandTimeout: 30000 },
    () => {
      const actions = ['Wrapped Ether', 'addOwnerWithThreshold', 'Sent']
      const tx = '3 transactions'

      cy.visit(constants.transactionsHistoryUrl + fundsSafes.SEP_FUNDS_SAFE_14)
      wallet.connectSigner(signer)
      main.acceptCookies()
      create_tx.verifyBulkTxHistoryBlock(create_tx.bulkTxs, tx, actions)
    },
  )

  it(
    'Verify bulk view for the outgoing and incoming txs in the History after swap',
    { defaultCommandTimeout: 30000 },
    () => {
      const data = [typeBulkTx.receive, typeBulkTx.send, typeBulkTx.COW, typeBulkTx.DAI]
      const tx = typeBulkTx.twoTx

      cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_1)
      main.acceptCookies()
      create_tx.toggleUntrustedTxs()
      create_tx.verifyBulkTxHistoryBlock(create_tx.swapOrder, tx, data)
    },
  )

  it(
    'Verify that Bulk Execution button is disabled if the tx in Next is not fully signed',
    { defaultCommandTimeout: 30000 },
    () => {
      cy.visit(constants.transactionQueueUrl + fundsSafes.SEP_FUNDS_SAFE_15)
      main.acceptCookies()
      create_tx.verifyBulkExecuteBtnIsDisabled()
    },
  )
})
