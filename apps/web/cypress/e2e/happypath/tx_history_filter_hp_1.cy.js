/* eslint-disable */
import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []
const startDate = '01/12/2023'
const endDate = '01/12/2023'
const startDate2 = '20/12/2023'
const endDate2 = '20/12/2023'

// TODO: Flaky tests, skipped until solved
describe.skip('Tx history happy path tests 1', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_7)
    main.acceptCookies()
  })

  it(
    'Verify a user can filter incoming transactions by dates, amount and token address',
    { defaultCommandTimeout: 60000 },
    () => {
      const uiDate = 'Dec 1, 2023'
      const uiDate2 = 'Dec 1, 2023 - 8:05:00 AM'
      const uiDate3 = 'Dec 1, 2023 - 7:52:36 AM'
      const uiDate4 = 'Dec 15, 2023 - 10:33:00 AM'
      const amount = '0.001'
      const token = '0x7CB180dE9BE0d8935EbAAc9b4fc533952Df128Ae'

      // date and amount
      createTx.clickOnFilterBtn()
      createTx.setTxType(createTx.filterTypes.incoming)
      createTx.fillFilterForm({ endDate: endDate, amount: amount })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(2)
      createTx.checkTxItemDate(0, uiDate)
      createTx.checkTxItemDate(1, uiDate)

      // combined filters
      createTx.clickOnFilterBtn()
      createTx.fillFilterForm({ startDate: startDate })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(2)
      createTx.checkTxItemDate(0, uiDate)
      createTx.checkTxItemDate(1, uiDate)

      // reset txs
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.verifyNumberOfTransactions(25)

      // chronological order
      createTx.fillFilterForm({ startDate: startDate, endDate: endDate })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(7)
      createTx.checkTxItemDate(5, uiDate2)
      createTx.checkTxItemDate(6, uiDate3)

      // token
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.fillFilterForm({ token: token })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(1)
      createTx.checkTxItemDate(0, uiDate4)

      // no txs
      createTx.clickOnFilterBtn()
      createTx.fillFilterForm({ startDate: startDate2, endDate: endDate2 })
      createTx.clickOnApplyBtn()
      createTx.verifyNoTxDisplayed('incoming')
    },
  )

  it(
    'Verify a user can filter outgoing transactions by dates, nonce, amount and recipient',
    { defaultCommandTimeout: 60000 },
    () => {
      const uiDate = 'Nov 30, 2023 - 11:06:00 AM'
      const uiDate2 = 'Dec 1, 2023 - 7:54:36 AM'
      const uiDate3 = 'Dec 1, 2023 - 7:37:24 AM'
      const uiDate4 = 'Nov 30, 2023 - 11:02:12 AM'
      const amount = '0.000000000001'
      const recipient = 'sep:0x06373d5e45AD31BD354CeBfA8dB4eD2c75B8708e'

      // date and recipient
      createTx.clickOnFilterBtn()
      createTx.setTxType(createTx.filterTypes.outgoing)

      createTx.fillFilterForm({ endDate: endDate, recipient: recipient })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(1)
      createTx.checkTxItemDate(0, uiDate4)

      // combined filters
      createTx.clickOnFilterBtn()
      createTx.fillFilterForm({ startDate: startDate })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(0)

      // reset txs
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(14)

      // chronological order
      createTx.clickOnFilterBtn()
      createTx.fillFilterForm({ startDate: startDate, endDate: endDate })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(2)
      createTx.checkTxItemDate(0, uiDate2)
      createTx.checkTxItemDate(1, uiDate3)

      // nonce
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.fillFilterForm({ nonce: '1' })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(1)
      createTx.checkTxItemDate(0, uiDate)

      // amount
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.fillFilterForm({ amount: amount })
      createTx.clickOnApplyBtn()
      createTx.verifyNumberOfTransactions(1)
      createTx.checkTxItemDate(0, uiDate4)

      // no txs
      createTx.clickOnFilterBtn()
      createTx.clickOnClearBtn()
      createTx.fillFilterForm({ startDate: startDate2, endDate: endDate2 })
      createTx.clickOnApplyBtn()
      createTx.verifyNoTxDisplayed('outgoing')
    },
  )
})
