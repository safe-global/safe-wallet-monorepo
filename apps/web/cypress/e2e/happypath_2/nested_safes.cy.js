import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import * as txs from '../pages/transactions.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as owner from '../pages/owners.pages'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const nestedSafe1Short = '0x22e5...Cf9d'

describe('Nested safes happy path tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that batch tx appears in the Queue with create proxy action', () => {
    const safe = 'Created safe'

    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_39)
    wallet.connectSigner(signer)
    cy.wait(5000)
    createTx.deleteAllTx()

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.clickOnAddNestedSafeBtn()
    createTx.hasNonce()
    createTx.changeNonce(3)
    nsafes.nameInputHasPlaceholder()
    nsafes.typeName(main.generateRandomString(51))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
    nsafes.typeName(safe)
    nsafes.clickOnAddNextBtn()
    txs.selectExecuteLater()
    createTx.clickOnContinueSignTransactionBtn()
    createTx.clickOnAcknowledgement()
    createTx.clickOnSignTransactionBtn()
    createTx.clickViewTransaction()
    main.verifyValuesExist(createTx.transactionItem, [
      createTx.tx_status.execute,
      nsafes.nonfundAssetsActions[0],
      nsafes.nonfundAssetsActions[1],
    ])
    sideBar.clickOnOpenNestedSafeListBtn()
    sideBar.checkSafesCountInPopverList(1)
    sideBar.clickOnSafeInPopover(nestedSafe1Short)
  })
})
