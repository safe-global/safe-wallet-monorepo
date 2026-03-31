import * as constants from '../../support/constants'
import * as portfolio from '../pages/portfolio.pages'
import * as main from '../pages/main.page'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Positions Tests', { defaultCommandTimeout: 60000, requestTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    main.injectChainFeature({
      chainId: constants.networkKeys.polygon,
      addFlag: constants.chainFeatures.positions,
      removeFlag: 'PORTFOLIO_ENDPOINT',
      dataEndpoint: constants.positionsEndpoint,
      dataAlias: 'getPositions',
    })
  })

  // TC #333
  it('Verify that the Positions widget on the dashboard displays all protocols with name and fiat value', () => {
    portfolio.visitAndSettle(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_33)
    portfolio.verifyWidgetIsVisible()
    portfolio.verifyProtocolInWidget(portfolio.protocols.aaveV3)
    portfolio.verifyProtocolInWidget(portfolio.protocols.morpho)
  })

  // TC #334
  it('Verify that clicking "View all" on the Positions widget navigates to Assets → Positions tab', () => {
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
