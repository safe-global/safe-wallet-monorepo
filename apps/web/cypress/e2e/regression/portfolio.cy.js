import * as constants from '../../support/constants'
import * as portfolio from '../pages/portfolio.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Positions AI tests', { defaultCommandTimeout: 60000, requestTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    // Intercept the chains list endpoint to inject the POSITIONS flag.
    cy.intercept('GET', '**/v2/chains**', (req) => {
      req.continue((res) => {
        if (res.body?.results && Array.isArray(res.body.results)) {
          res.body.results = res.body.results.map((chain) => {
            if (chain.chainId !== constants.networkKeys.polygon) return chain
            const features = (chain.features || []).filter((f) => f !== 'PORTFOLIO_ENDPOINT')
            if (!features.includes(constants.chainFeatures.positions)) features.push(constants.chainFeatures.positions)
            return { ...chain, features }
          })
        } else if (res.body?.chainId === constants.networkKeys.polygon) {
          const features = (res.body.features || []).filter((f) => f !== 'PORTFOLIO_ENDPOINT')
          if (!features.includes(constants.chainFeatures.positions)) features.push(constants.chainFeatures.positions)
          res.body = { ...res.body, features }
        }
      })
    })

    cy.intercept('GET', constants.positionsEndpoint).as('getPositions')
  })

  // TC #333
  it('[SMOKE] Verify that the Positions widget on the dashboard displays all protocols with name and fiat value', () => {
    portfolio.visitAndSettle(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyWidgetIsVisible()
    portfolio.verifyProtocolInWidget(portfolio.protocols.aaveV3)
    portfolio.verifyProtocolInWidget(portfolio.protocols.morpho)
  })

  // TC #334
  it('[SMOKE] Verify that clicking "View all" on the Positions widget navigates to Assets → Positions tab', () => {
    portfolio.visitAndSettle(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyProtocolInWidget(portfolio.protocols.aaveV3)
    portfolio.clickViewAllInWidget()
    portfolio.verifyOnPositionsTab()
  })

  // TC #338
  it('Verify that the Positions tab lists all protocols with their name, icon, fiat value, and percentage share', () => {
    portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyProtocolListed(portfolio.protocols.aaveV3)
    portfolio.verifyProtocolListed(portfolio.protocols.morpho)
    portfolio.verifyFiatValueVisible()
    portfolio.verifyPercentageShareVisible()
  })

  // TC #339
  it('Verify that each protocol accordion in the Positions tab is expandable and shows position groups with token name, symbol, position type, balance and fiat value', () => {
    portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyPositionGroupVisible(portfolio.positionGroups.aaveV3Lending)
    portfolio.verifyTokenNameVisible(portfolio.tokenNames.wrappedMatic)
    portfolio.verifyTokenNameVisible(portfolio.tokenNames.aave)
    portfolio.verifyPositionTypeVisible(portfolio.positionTypes.deposited)
    portfolio.verifyFiatValueVisible()
    portfolio.verifyPositionGroupVisible(portfolio.positionGroups.aaveV3Lending)
    portfolio.collapseProtocolAccordion(portfolio.protocols.aaveV3)
    portfolio.verifyPositionGroupNotVisible(portfolio.positionGroups.aaveV3Lending)
    portfolio.expandProtocolAccordion(portfolio.protocols.aaveV3)
    portfolio.verifyPositionGroupVisible(portfolio.positionGroups.aaveV3Lending)
  })

  // TC #340
  it('Verify that the "Total positions value" title and a fiat value are visible on the Positions tab', () => {
    portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyTotalPositionsTitleVisible()
    portfolio.verifyFiatValueVisible()
  })

  it('Verify that the Positions widget is not displayed on the dashboard when the positions endpoint fails', () => {
    portfolio.stubPositionsError(constants.positionsEndpoint)
    portfolio.visitAndSettleError(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyWidgetIsNotVisible()
  })

  it('Verify that the Positions tab shows an error message when the positions endpoint fails', () => {
    portfolio.stubPositionsError(constants.positionsEndpoint)
    portfolio.visitAndSettleError(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyPositionsUnavailableVisible()
  })
})
