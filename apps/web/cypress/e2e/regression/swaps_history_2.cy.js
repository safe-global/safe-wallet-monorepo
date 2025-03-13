import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as data from '../../fixtures/txhistory_data_data.json'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const swapsHistory = swaps_data.type.history
const typeGeneral = data.type.general

const safe = 'sep:0xF184a243925Bf7fb1D64487339FF4F177Fb75644'

describe('Swaps history tests 2', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify swap sell order with one action', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.sell1Action)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')

    create_tx.verifyExpandedDetails([swapsHistory.sellFull, dai, eq, swapsHistory.dai, swapsHistory.filled])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.gGpV2, swapsHistory.actionPreSignatureG])
  })

  // Added to prod
  it('Verify swap buy operation with 2 actions: approve & swap', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.buy2actions)
    const eq = swaps.createRegex(swapsHistory.oneGNOFull, 'COW')
    const atMost = swaps.createRegex(swapsHistory.forAtMostCow, 'COW')

    create_tx.verifyExpandedDetails([
      swapsHistory.buyOrder,
      swapsHistory.buy,
      eq,
      atMost,
      swapsHistory.cow,
      swapsHistory.expired,
      swapsHistory.actionApprove,
      swapsHistory.actionPreSignature,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_3_0])
  })

  it('Verify swap operation with 2 actions: wrap & swap', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + safe + swaps.swapTxs.wrapSwap)
    const eq = swaps.createRegex(swapsHistory.COWeqWETH, 'COW')
    const atLeast = swaps.createRegex(swapsHistory.forAtLeastFullCow, 'COW')

    create_tx.verifyExpandedDetails([
      swapsHistory.sellOrder,
      swapsHistory.sell,
      eq,
      atLeast,
      swapsHistory.cow,
      swapsHistory.filled,
      swapsHistory.actionDepositEth,
      swapsHistory.actionApproveEth,
      swapsHistory.actionPreSignature,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_3_0])
  })

  it('Verify "Cancelled" status for manually cancelled limit orders', { defaultCommandTimeout: 30000 }, () => {
    const safe = '0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9'
    cy.visit(constants.transactionUrl + safe + swaps.swapTxs.sellCancelled)
    const uni = swaps.createRegex(swapsHistory.forAtLeastFullUni, 'UNI')
    const eq = swaps.createRegex(swapsHistory.UNIeqCOW, 'K COW')

    create_tx.verifyExpandedDetails([
      swapsHistory.sellOrder,
      swapsHistory.sell,
      uni,
      eq,
      swapsHistory.cow,
      swapsHistory.cancelled,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.gGpV2, swapsHistory.actionPreSignatureG])
  })

  it('Verify swap operation with 3 actions: wrap & approve & swap', { defaultCommandTimeout: 30000 }, () => {
    const safe = '0x140663Cb76e4c4e97621395fc118912fa674150B'
    cy.visit(constants.transactionUrl + safe + swaps.swapTxs.sell3Actions)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqWETH, 'WETH')

    create_tx.verifyExpandedDetails([
      swapsHistory.sellOrder,
      swapsHistory.sell,
      dai,
      eq,
      swapsHistory.actionApproveEth,
      swapsHistory.actionPreSignature,
      swapsHistory.actionDepositEth,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_3_0])
  })

  // Added to prod
  it(
    'Verify there is decoding for a tx created by CowSwap safe-app in the history',
    { defaultCommandTimeout: 30000 },
    () => {
      cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.safeAppSwapOrder)
      const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
      const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
      main.verifyValuesExist(create_tx.transactionItem, [swapsHistory.title])
      create_tx.verifySummaryByName(swapsHistory.title, null, [typeGeneral.statusOk])
      main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow], create_tx.altImgSwaps)
      create_tx.verifyExpandedDetails([swapsHistory.sell10Cow, dai, eq, swapsHistory.dai, swapsHistory.filled])
    },
  )

  it('Verify token order in sell and buy operations', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.sell1Action)
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
    swaps.checkTokenOrder(eq, swapsHistory.executionPrice)

    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.buy2actions)
    const eq2 = swaps.createRegex(swapsHistory.oneGNOFull, 'COW')
    swaps.checkTokenOrder(eq2, swapsHistory.limitPrice)
  })

  it('Verify OrderID url on cowswap explorer', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.sell1Action)
    swaps.verifyOrderIDUrl()
  })
})
