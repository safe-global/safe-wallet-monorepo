import txs from '../../fixtures/sharing-transactions.js'
import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'

let staticSafes = []

describe('Transaction share link tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify share tx link exists on Tx details in Queued list when additional signature is required', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + txs.tx1)
    main.verifyElementsExist([create_tx.txShareLinkBtn])
  })

  it('Verify that share link exists in the executed tx', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + txs.tx4)
    main.verifyElementsExist([create_tx.txShareLinkBtn])
  })

  it('Verify that share link is displayed for the proposed for signing txs', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareLinkBtn])
  })

  it('Verify click on the share link copies the correct URL', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareLinkBtn])
    create_tx.verifyCopiedURL()
  })

  it('Verify the tracking for the share link. GA: Copy deeplink', () => {
    const shareBlockCopiedLink = [
      {
        eventAction: events.txCopyShareBlockLink.action,
        eventCategory: events.txCopyShareBlockLink.category,
        event: events.txCopyShareBlockLink.event,
        safeAddress: staticSafes.SEP_STATIC_SAFE_31.slice(6),
      },
    ]
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareLinkBtn])
    create_tx.verifyCopiedURL()

    getEvents()
    checkDataLayerEvents(shareBlockCopiedLink)
  })
})
