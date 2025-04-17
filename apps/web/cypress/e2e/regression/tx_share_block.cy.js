import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'

let staticSafes = []

const txs = {
  tx1: '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x539c9c2cd63bae1e4f84f71ef9aa7aea1fd8edb82b089c741cffad99843d0884',
  tx2: '&id=multisig_0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F_0x329f5c9429ec366e99b4f7c981417267b6718e4896182d614fbc86673e0dd39c',
  tx3: '&id=multisig_0x09725D3c2f9bE905F8f9f1b11a771122cf9C9f35_0xd70f2f8b31ae98a7e3064f6cdb437e71d3df083a0709fb82c915fa82767a19eb',
  tx4: '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x35aa6e1de3ebc7c5aebe461b4b16adf28a258c9e78d4eb1a48121f1a0a8a58aa',
}

describe('Transaction share block tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify share tx block URL exists on Tx details in Queued list when additional signature is required', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + txs.tx1)
    main.verifyElementsExist([create_tx.txShareBlock])
    create_tx.expandTxShareBlock()
  })

  it('Verify that share block exists in the executed tx', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + txs.tx4)
    main.verifyElementsExist([create_tx.txShareBlock])
    create_tx.checkCopyBtnExistsInShareblock()
  })

  it('Verify that share block is displayed for the proposed for signing txs', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareBlock])
    create_tx.expandTxShareBlock()
  })

  it('Verify click on the Copy link, copies the correct URL', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareBlock])
    create_tx.expandTxShareBlock()
    create_tx.verifyCopiedURL()
  })

  it('Verify the tracking for the Share block. GA: Open share block, Copy deeplink', () => {
    const shareBlockExpanded = [
      {
        eventAction: events.txOpenShareBlock.action,
        eventCategory: events.txOpenShareBlock.category,
        event: events.txOpenShareBlock.event,
        safeAddress: staticSafes.SEP_STATIC_SAFE_31.slice(6),
      },
    ]
    const shareBlockCopiedLink = [
      {
        eventAction: events.txCopyShareBlockLink.action,
        eventCategory: events.txCopyShareBlockLink.category,
        event: events.txCopyShareBlockLink.event,
        safeAddress: staticSafes.SEP_STATIC_SAFE_31.slice(6),
      },
    ]
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + txs.tx3)
    main.verifyElementsExist([create_tx.txShareBlock])
    create_tx.expandTxShareBlock()
    create_tx.verifyCopiedURL()

    getEvents()
    checkDataLayerEvents(shareBlockExpanded)
    checkDataLayerEvents(shareBlockCopiedLink)
  })
})
