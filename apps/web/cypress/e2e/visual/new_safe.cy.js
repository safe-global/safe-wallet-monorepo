import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safe from '../pages/load_safe.pages.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe('[VISUAL] New safe form screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot create new safe form', () => {
    cy.visit(constants.createNewSafeSepoliaUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot load existing safe form', () => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
    // Skip awaitVisualStability — the load form has a persistent circular skeleton for the identicon placeholder
  })

  it('[VISUAL] Screenshot load safe with invalid address error', () => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
    safe.inputAddress('Random text')
    // Skip awaitVisualStability — the load form has a persistent circular skeleton for the identicon placeholder
  })
})
