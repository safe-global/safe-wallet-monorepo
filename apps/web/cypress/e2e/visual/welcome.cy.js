import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as ls from '../../support/localstorage_data.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe('[VISUAL] Welcome page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot welcome page', () => {
    cy.visit(constants.welcomeUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot accounts page with added safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1)
    cy.visit(constants.welcomeAccountUrl)
    main.awaitVisualStability()
  })
})
