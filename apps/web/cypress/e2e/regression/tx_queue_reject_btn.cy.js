import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page'
import { disconnectedUserErrorMsg } from '../pages/owners.pages'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []

let signer, signer2
before(() => {
  signer = walletCredentials.OWNER_3_PRIVATE_KEY
  signer2 = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Transaction queue Reject button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that Reject button is disabled out for non-owners and disconnected users', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    create_tx.verifyRejectBtnDisabled()
    wallet.connectSignerViaStorage(signer)
    create_tx.verifyRejectBtnDisabled()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that clicking a disabled Reject button when not connected opens the Onboard modal', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    create_tx.hoverOverRejectBtnBtn()
    main.verifyTextVisibility([disconnectedUserErrorMsg])
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
