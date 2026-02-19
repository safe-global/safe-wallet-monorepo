import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

// Executed transaction on SEP_STATIC_SAFE_7
const executedTx =
  '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x35aa6e1de3ebc7c5aebe461b4b16adf28a258c9e78d4eb1a48121f1a0a8a58aa'

describe(
  '[VISUAL] Transaction detail page screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      mockVisualTestApis()
    })

    it('[VISUAL] Screenshot executed transaction detail page', () => {
      cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + executedTx)
      cy.contains('Transaction details', { timeout: 30000 }).should('be.visible')
      main.awaitVisualStability()
    })
  },
)
