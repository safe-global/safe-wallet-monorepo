import * as batch from '../pages/batches.pages'
import * as constants from '../../support/constants'
import * as owner from '../../e2e/pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as ls from '../../support/localstorage_data.js'
import { walletCredentials } from '../../support/credentials.js'

const funds_first_tx = '0.001'
const funds_second_tx = '0.002'

let staticSafes = []
let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Batch transaction tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Operating on a pre-seeded batch', () => {
    beforeEach(() => {
      wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2, {
        extraStorage: { [constants.localStorageKeys.SAFE_v2__batch]: ls.batchData.entry0 },
      })
      owner.waitForConnectionStatus()
    })

    it('Verify that clicking on "Confirm batch" button opens confirm batch modal with listed transactions', () => {
      batch.clickOnBatchCounter()
      batch.clickOnConfirmBatchBtn()
      cy.contains(funds_first_tx).parents('ul').as('TransactionList')
      cy.get('@TransactionList').find('li').eq(0).contains(funds_first_tx)
      cy.get('@TransactionList').find('li').eq(1).contains(funds_second_tx)
      cy.contains(batch.addToBatchBtn).should('have.length', 0)
    })
  })
})
