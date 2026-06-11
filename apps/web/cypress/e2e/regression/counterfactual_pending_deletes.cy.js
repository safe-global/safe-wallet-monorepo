import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Counterfactual pending CF delete queue regression tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    // Seeded SIWE session so isAuthenticated() returns true on load — required
    // for useCounterfactualSafeSync to flush the persisted queue.
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__auth, {
      sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    })
  })

  it('Verify that ghost pending CF delete entries are drained on 404 instead of retried forever', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__pendingCfDeletes, ls.pendingCfDeletes.twoGhostEntries)

    cy.intercept('DELETE', constants.counterfactualSafesEndpoint, {
      statusCode: 404,
      body: { message: 'not found' },
    }).as('flushDelete')

    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_0)

    // One DELETE per queued entry — both fire in parallel during the initial sync.
    cy.wait(['@flushDelete', '@flushDelete'])

    // Each 404 must drop its entry from the persisted queue. Before the fix the
    // entries stayed forever and every page load fired N parallel DELETEs.
    main.verifyAppLocalStorageItemEquals(constants.localStorageKeys.SAFE_v2__pendingCfDeletes, [])
  })
})
