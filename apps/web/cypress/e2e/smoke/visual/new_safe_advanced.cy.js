import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'

describe(
  '[VISUAL] Advanced create safe screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    it('[VISUAL] Screenshot advanced create new safe form', () => {
      cy.visit('/new-safe/advanced-create?chain=sep')
      cy.contains('Create new Safe Account', { timeout: 30000 }).should('be.visible')
      main.verifySkeletonsGone()
    })
  },
)
