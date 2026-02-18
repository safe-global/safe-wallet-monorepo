import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as batch from '../pages/batches.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe(
  '[VISUAL] Batch transaction screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    it('[VISUAL] Screenshot empty batch list', () => {
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
      cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
      batch.openBatchtransactionsModal()
      main.waitForMuiAnimationsToSettle()
      cy.contains(batch.addInitialTransactionStr, { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })

    it('[VISUAL] Screenshot batch list with transaction', () => {
      main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__batch, ls.batchData.entry1)
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
      cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
      cy.reload()
      batch.verifyBatchIconCount(1)
      batch.clickOnBatchCounter()
      main.waitForMuiAnimationsToSettle()
      cy.contains(batch.batchedTransactionsStr, { timeout: 10000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
