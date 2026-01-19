import * as constants from '../../support/constants'
import * as owner from '../pages/owners.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as navigation from '../pages/navigation.page'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Happy path Add Owners tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it(
    'Verify that add owner transaction can be created, confirmed by multiple signers, and deleted with Google Analytics tracking',
    { defaultCommandTimeout: 30000 },
    () => {
      const tx_confirmed = [
        {
          eventLabel: events.txConfirmedAddOwner.eventLabel,
          eventCategory: events.txConfirmedAddOwner.category,
          eventType: events.txConfirmedAddOwner.eventType,
          safeAddress: staticSafes.SEP_STATIC_SAFE_24.slice(6),
        },
      ]

      createTx.cleanTransactionQueue(staticSafes.SEP_STATIC_SAFE_24, signer2)
      createTx.createAddOwnerTransaction(staticSafes.SEP_STATIC_SAFE_24, signer2, constants.SEPOLIA_OWNER_2, 2)

      createTx.verifySingleTxPage()

      // Switch to signer1 and confirm the transaction
      // switchToSignerAndConfirm will disconnect signer2 (if connected) and connect signer1
      createTx.switchToSignerAndConfirm(signer)

      // After signer1 confirms, disconnect signer1 and connect signer2 to delete the transaction
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
      wallet.connectSigner(signer2)

      getEvents()
      checkDataLayerEvents(tx_confirmed)
      createTx.deleteTx()
    },
  )
})
