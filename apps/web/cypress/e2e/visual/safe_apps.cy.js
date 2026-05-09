import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safeapps from '../pages/safeapps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe('[VISUAL] Safe Apps screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    mockVisualTestApis()
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[VISUAL] Screenshot Safe Apps list', () => {
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot Safe Apps search filtered results', () => {
    safeapps.typeAppName('Transaction Builder')
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot Safe Apps no results state', () => {
    safeapps.typeAppName('zzzznonexistentapp12345')
    main.awaitVisualStability()
  })
})
