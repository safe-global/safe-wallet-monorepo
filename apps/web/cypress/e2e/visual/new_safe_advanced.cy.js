import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe(
  '[VISUAL] Advanced create safe screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    beforeEach(() => {
      mockVisualTestApis()
    })

    it('[VISUAL] Screenshot advanced create new safe form', () => {
      cy.visit(constants.advancedCreateSafeSepoliaUrl)
      main.awaitVisualStability()
    })
  },
)
