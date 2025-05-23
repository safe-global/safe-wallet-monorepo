import * as constants from '../../support/constants.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as address_book from '../pages/address_book.page.js'

let staticSafes = []

const typeReceive = data.type.receive
const typeGeneral = data.type.general

const safe = 'eth:0x8675B754342754A30A2AeF474D114d8460bca19b'
const dai =
  '&id=transfer_0x8675B754342754A30A2AeF474D114d8460bca19b_e715646c00d8c513b16de213dbdcfea16f58aa1294306fdd5866a4d1fab643e4794'
const nft =
  '&id=transfer_0x8675B754342754A30A2AeF474D114d8460bca19b_e3873b1a1310fd4acd00249456b9700ea7fbe1e61261c3efd08a288abf8756d0b138'
const eth =
  '&id=transfer_0x8675B754342754A30A2AeF474D114d8460bca19b_idc6b8280a40b5979908bc7a116b38ac6b7ae22feea09fbc1dc1373421ff4f250'

describe('Incoming tx history details tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify Incoming details ERC20', () => {
    cy.visit(constants.transactionUrl + safe + dai)
    createTx.verifySummaryByName(
      typeReceive.summaryTxInfoDAI,
      null,
      [typeReceive.summaryTitle, typeGeneral.statusOk],
      typeReceive.altImage,
      typeReceive.altImageDAI,
    )
    createTx.verifyExpandedDetails([
      typeReceive.GPv2Settlement,
      typeReceive.GPv2SettlementAddress,
      typeReceive.txHashDAI,
      typeReceive.executionDateDAI,
    ])
    createTx.verifyNumberOfExternalLinks(2)
  })

  it('Verify Incoming details ERC721', () => {
    cy.visit(constants.transactionUrl + safe + nft)
    createTx.verifySummaryByName(
      typeReceive.summaryTxInfoNFT,
      null,
      [typeReceive.summaryTitle, typeGeneral.statusOk],
      typeReceive.altImage,
      typeReceive.altTokenNFT,
    )
    createTx.verifyExpandedDetails([
      typeReceive.Proxy,
      typeReceive.ProxyAddress,
      typeReceive.nftHash,
      typeReceive.executionDateNFT,
    ])
    createTx.verifyNumberOfExternalLinks(2)
  })

  it('Verify Incoming details Native token', () => {
    cy.visit(constants.transactionUrl + safe + eth)
    createTx.verifySummaryByName(
      typeReceive.summaryTxInfoETH_2,
      null,
      [typeReceive.summaryTitle, typeGeneral.statusOk],
      typeReceive.altImage,
      typeReceive.altToken,
    )
    createTx.verifyExpandedDetails([typeReceive.senderAddressEth, typeReceive.txHashEth, typeReceive.executionDateEth])
    createTx.verifyNumberOfExternalLinks(2)
  })

  it('Verify add to the address book for the sender in the incoming tx', () => {
    const senderName = 'Sender100'
    cy.visit(constants.transactionUrl + safe + eth)
    address_book.clickOnMoreActionsBtn()
    address_book.clickOnAddToAddressBookBtn()
    address_book.typeInName(senderName)
    address_book.clickOnSaveEntryBtn()
    cy.visit(constants.addressBookUrl + safe)
    cy.get('body').should('be.visible')
    cy.contains(senderName)
  })
})
