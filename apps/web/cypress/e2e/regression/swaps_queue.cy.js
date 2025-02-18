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

describe('Swaps queue tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it(
    'Verify that the swap tx created via Cowswap safe app has decoding in the queue',
    () => {
      cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.swapQueue)
      const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
      const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
      main.verifyValuesExist(create_tx.transactionItem, [swapsHistory.title])
      create_tx.verifySummaryByName(swapsHistory.title, null, [typeGeneral.statusExpired])
      main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow], create_tx.altImgSwaps)
      create_tx.verifyExpandedDetails([swapsHistory.sell100Cow, dai, eq, swapsHistory.dai, swapsHistory.expired])
    },
  )
})
