import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as nfts from '../pages/nfts.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] NFTs page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot NFTs page with items', () => {
    cy.fixture('nfts/nfts.json').then((mockData) => {
      cy.intercept('GET', constants.collectiblesEndpoint, mockData).as('getCollectibles')
      cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_23)
    })
    cy.wait('@getCollectibles')
    nfts.waitForNftItems(1)
    main.verifySkeletonsGone()
  })
})
