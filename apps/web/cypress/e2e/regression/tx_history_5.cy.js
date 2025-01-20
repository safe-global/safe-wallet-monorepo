import * as constants from '../../support/constants.js'
import * as createTx from '../pages/create_tx.pages.js'
import * as data from '../../fixtures/txhistory_data_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as main from '../pages/main.page.js'

let staticSafes = []

const typeSend = data.type.send
const typeGeneral = data.type.general

const safe = 'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551'
const txbuilder =
  '&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0x97d4c1b3149853c0d8ca71bd700faae628f0a833bdb4bd9c6b14c171117703d4'

describe('Safe app tx history tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify tx builder has icon and app name', () => {
    cy.visit(constants.transactionUrl + safe + txbuilder)
    createTx.verifySummaryByName(typeSend.txBuilderTitle, null, [typeGeneral.statusOk], typeSend.txBuilderAltImage)
    main.verifyValuesExist(createTx.transactionItem, [typeSend.txBuilderTitle])
  })
})
