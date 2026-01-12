import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const commonTokens = ['ETH', 'GNO', 'SAFE', 'USDT', 'SAI', 'OMG', 'OWL']
const txServiceOnlyTokens = ['cSAI', 'LUNC', 'BUN']

describe('[SMOKE] Balances endpoint tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.ETH_STATIC_SAFE_15)
  })

  it('[SMOKE] Verify default token list shows expected tokens', () => {
    assets.toggleShowAllTokens(false)
    assets.toggleHideDust(false)
    main.verifyValuesExist(assets.tokenListTable, commonTokens)
    main.verifyValuesDoNotExist(assets.tokenListTable, txServiceOnlyTokens)
  })

  it('[SMOKE] Verify all tokens list shows additional tokens', () => {
    assets.toggleHideDust(false)
    assets.toggleShowAllTokens(true)
    main.verifyValuesExist(assets.tokenListTable, commonTokens)
    main.verifyValuesExist(assets.tokenListTable, txServiceOnlyTokens)
  })

  it('[SMOKE] Verify switching token list updates displayed tokens', () => {
    assets.toggleHideDust(false)
    assets.toggleShowAllTokens(true)
    main.verifyValuesExist(assets.tokenListTable, txServiceOnlyTokens)
    assets.toggleShowAllTokens(false)
    main.verifyValuesDoNotExist(assets.tokenListTable, txServiceOnlyTokens)
    main.verifyValuesExist(assets.tokenListTable, commonTokens)
  })
})
