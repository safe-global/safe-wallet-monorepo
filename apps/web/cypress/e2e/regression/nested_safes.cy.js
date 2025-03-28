import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import * as ls from '../../support/localstorage_data.js'
import * as txs from '../pages/transactions.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const mainSafe = 'Main nested safe'
const nestedSafe1 = 'Nested safe1'
const nestedSafe2 = 'Nested safe2'
const nestedSafe1Short = '0x22e5...Cf9d'
const nestedSafe2Short = '0xE557...2208'

describe('Nested safes basic flow tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify nested safes preserve correct structure', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.nestedsafes)

    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_39)
    // Check nested safe 1
    sideBar.clickOnOpenNestedSafeListBtn()
    sideBar.checkSafesInPopverList([nestedSafe1Short])
    sideBar.clickOnSafeInPopover(nestedSafe1Short)
    cy.url().should('include', staticSafes.SEP_STATIC_SAFE_40.substring(4))
    sideBar.checkParentSafeInBreadcrumb(mainSafe, staticSafes.SEP_STATIC_SAFE_39.substring(4))
    sideBar.checkNestedSafeInBreadcrumb(nestedSafe1)
    main.getSafe(staticSafes.SEP_STATIC_SAFE_40.substring(4), constants.networkKeys.sepolia).then((body) => {
      expect(body.owners).to.have.length(1)
      expect(body.owners[0].value).to.eq(staticSafes.SEP_STATIC_SAFE_39.substring(4))
    })

    // Check nested safe 2
    sideBar.clickOnOpenNestedSafeListBtn()
    sideBar.checkSafesInPopverList([nestedSafe2Short])
    sideBar.clickOnSafeInPopover(nestedSafe2Short)
    cy.url().should('include', staticSafes.SEP_STATIC_SAFE_41.substring(4))
    sideBar.checkParentSafeInBreadcrumb(nestedSafe1, staticSafes.SEP_STATIC_SAFE_40.substring(4))
    sideBar.checkNestedSafeInBreadcrumb(nestedSafe2)
    main.getSafe(staticSafes.SEP_STATIC_SAFE_41.substring(4), constants.networkKeys.sepolia).then((body) => {
      expect(body.owners).to.have.length(1)
      expect(body.owners[0].value).to.eq(staticSafes.SEP_STATIC_SAFE_40.substring(4))
    })

    // Go to nested safe 1
    sideBar.clickOnParentSafeInBreadcrumb()
    cy.url().should('include', staticSafes.SEP_STATIC_SAFE_40.substring(4))

    // Go to main safe
    sideBar.clickOnParentSafeInBreadcrumb()
    cy.url().should('include', staticSafes.SEP_STATIC_SAFE_39.substring(4))
  })

  it('Verify a nested safe can be created and seen in queue', () => {
    const safe = 'Created safe'

    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_39)
    wallet.connectSigner(signer)
    cy.wait(5000)
    createTx.deleteAllTx()

    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.clickOnAddNestedSafeBtn()
    createTx.changeNonce(3)
    nsafes.typeName(safe)
    nsafes.clickOnAddNextBtn()
    txs.selectExecuteLater()
    createTx.clickOnContinueSignTransactionBtn()
    createTx.clickOnAcknowledgement()
    createTx.clickOnSignTransactionBtn()
    createTx.clickViewTransaction()
    main.verifyValuesExist(createTx.transactionItem, [createTx.tx_status.execute])
    sideBar.clickOnOpenNestedSafeListBtn()
    sideBar.checkSafesCountInPopverList(1)
    sideBar.clickOnSafeInPopover(nestedSafe1Short)
  })
})
