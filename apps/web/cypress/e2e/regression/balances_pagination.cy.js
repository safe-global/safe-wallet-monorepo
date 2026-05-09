import * as constants from '../../support/constants'
import * as assets from '../pages/assets.pages'
import * as main from '../../e2e/pages/main.page'

const ASSETS_LENGTH = 8

describe('Balance pagination tests', () => {
  it('Verify a user can change rows per page and navigate to next and previous page', () => {
    cy.visit(constants.BALANCE_URL + constants.SEPOLIA_TEST_SAFE_6)
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.verifyInitialTableState()
    assets.changeTo10RowsPerPage()
    assets.verifyTableHas10Rows()
    assets.navigateToNextPage()
    assets.verifyTableHasNRows(ASSETS_LENGTH)
    assets.navigateToPreviousPage()
    assets.verifyTableHas10RowsAgain()
  })
})
