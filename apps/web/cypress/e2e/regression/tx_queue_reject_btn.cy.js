import * as constants from '../../support/constants.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []

let signer2
before(() => {
  signer2 = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Transaction queue Reject button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify a Reject tx cannot be "Added as batch"', () => {
    wallet.connectSignerViaStorage(
      signer2,
      constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder,
    )
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnRejectionChoiceBtn(1)
    create_tx.clickOnContinueSignTransactionBtn()
    create_tx.checkThatComboButtonOptionIsNotPresent(create_tx.comboButtonOptions.addToBatch)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
