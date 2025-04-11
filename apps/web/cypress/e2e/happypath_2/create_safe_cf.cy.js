import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as wallet from '../../support/utils/wallet.js'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
// DO NOT use OWNER_2_PRIVATE_KEY for safe creation. Used for CF safes.
const signer = walletCredentials.OWNER_2_PRIVATE_KEY

describe('CF Safe creation happy path tests', () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl + '?chain=sep')
    // Required for data layer
    cy.clearLocalStorage()
    main.acceptCookies()
    getEvents()
  })

  it('CF creation happy path. GA safe_created', () => {
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
    createwallet.clickOnContinueWithWalletBtn()
    createwallet.clickOnCreateNewSafeBtn()
    createwallet.clickOnNextBtn()
    createwallet.clickOnNextBtn()
    createwallet.selectPayNowOption()
    createwallet.clickOnReviewStepNextBtn()
    cy.wait(1000)
    main.getAddedSafeAddressFromLocalStorage(constants.networkKeys.sepolia, 0).then((address) => {
      const safe_created = [
        {
          eventLabel: events.safeCreatedCF.eventLabel,
          eventCategory: events.safeCreatedCF.category,
          eventAction: events.safeCreatedCF.action,
          eventType: events.safeCreatedCF.eventType,
          event: events.safeCreatedCF.eventName,
          safeAddress: address.slice(2),
        },
      ]
      checkDataLayerEvents(safe_created)
      createwallet.clickOnLetsGoBtn()
      createwallet.verifyCFSafeCreated()
    })
  })
})
