import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as data from '../../fixtures/txhistory_data_data.json'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []

const swapsHistory = swaps_data.type.history
const typeGeneral = data.type.general

describe('[PROD] Swaps history tests 2', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify swap buy operation with 2 actions: approve & swap', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(
      constants.prodbaseUrl + constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.buy2actions,
    )
    cy.contains(createTx.txDetailsStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
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
  })

  it(
    'Verify there is decoding for a tx created by CowSwap safe-app in the history',
    { defaultCommandTimeout: 30000 },
    () => {
      cy.visit(
        constants.prodbaseUrl +
          constants.transactionUrl +
          staticSafes.SEP_STATIC_SAFE_1 +
          swaps.swapTxs.safeAppSwapOrder,
      )
      const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
      const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
      cy.contains(createTx.txDetailsStr, { timeout: 10000 })
      closeSecurityNotice()
      acceptCookies2()
      main.verifyValuesExist(create_tx.transactionItem, [swapsHistory.title])
      create_tx.verifySummaryByName(swapsHistory.title, null, [typeGeneral.statusOk])
      main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow], create_tx.altImgSwaps)
      create_tx.verifyExpandedDetails([swapsHistory.sell10Cow, dai, eq, swapsHistory.dai, swapsHistory.filled])
    },
  )
})
