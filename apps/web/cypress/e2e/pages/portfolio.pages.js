// ── Selectors ────────────────────────────────────────────────────────────────

export const positionsWidget = '[data-testid="positions-widget"]'
export const viewAllLink = '[data-testid="view-all-link"]'
export const positionsUnavailableText = '[data-testid="positions-unavailable-text"]'

// ── Strings ──────────────────────────────────────────────────────────────────

export const totalPositionsTitle = 'Total positions value'
export const errorMessage = "Couldn't load your positions"

// ── Test-data constants (real positions held by MATIC_STATIC_SAFE_33) ────────

// Protocols present on the real safe (matic:0xc1f4652866ddB3811adcd3418c13eF640e88E1f6):
//   AAVE V3  — position group "Aave V3 Lending", tokens: WMATIC, AAVE, DAI, GHST
//   Morpho   — position group "Morpho Yield: WPOL Pool", token: WMATIC
export const protocols = {
  aaveV3: 'AAVE V3',
  morpho: 'Morpho',
}

export const positionGroups = {
  aaveV3Lending: 'Aave V3 Lending',
  morphoYieldPool: 'Morpho Yield: WPOL Pool',
}

export const tokenNames = {
  wrappedMatic: 'Wrapped Matic',
  aave: 'Aave',
  daiStablecoin: 'Dai Stablecoin',
  aavegotchi: 'Aavegotchi',
}

export const positionTypes = {
  deposited: 'Deposited',
}

// ── Navigation helpers ────────────────────────────────────────────────────────

export function visitAndSettle(url) {
  cy.visit(url)
  cy.wait('@getPositions')
  cy.get('body').type('{esc}', { force: true })
  cy.get('[data-nextjs-dialog-backdrop]').should('not.exist')
}

export function stubPositionsError(positionsEndpoint) {
  cy.intercept('GET', positionsEndpoint, { statusCode: 500 }).as('getPositionsError')
}

export function visitAndSettleError(url) {
  cy.visit(url)
  cy.wait('@getPositionsError')
  cy.get('body').type('{esc}', { force: true })
  cy.get('[data-nextjs-dialog-backdrop]').should('not.exist')
}

// ── Widget helpers ────────────────────────────────────────────────────────────

export function verifyWidgetIsVisible() {
  cy.get(positionsWidget).should('be.visible')
}

export function verifyWidgetIsNotVisible() {
  cy.get(positionsWidget).should('not.exist')
}

export function verifyPositionsUnavailableVisible() {
  cy.get(positionsUnavailableText).should('be.visible').and('contain.text', errorMessage)
}

export function verifyProtocolInWidget(protocolName) {
  cy.get(positionsWidget).within(() => {
    cy.contains(protocolName).should('be.visible')
  })
}

export function verifyProtocolNotInWidget(protocolName) {
  cy.get(positionsWidget).within(() => {
    cy.contains(protocolName).should('not.exist')
  })
}

export function clickViewAllInWidget() {
  cy.get(positionsWidget).find(viewAllLink).scrollIntoView().should('be.visible').click({ force: true })
}

// ── Positions tab helpers ─────────────────────────────────────────────────────

export function verifyOnPositionsTab() {
  cy.url().should('include', '/balances/positions')
}

export function verifyProtocolListed(protocolName) {
  cy.contains(protocolName).should('be.visible')
}

export function verifyPercentageShareVisible() {
  cy.contains(/%/).should('be.visible')
}

export function verifyTotalPositionsTitleVisible() {
  cy.contains(totalPositionsTitle).should('be.visible')
}

export function verifyFiatValueVisible() {
  cy.contains(/\$ [\d,]+(\.\d+)?/).should('be.visible')
}

export function verifyPositionGroupVisible(groupName) {
  cy.contains(groupName).should('be.visible')
}

export function verifyPositionGroupNotVisible(groupName) {
  cy.contains(groupName).should('not.be.visible')
}

export function verifyTokenNameVisible(tokenName) {
  cy.contains(tokenName).should('be.visible')
}

export function verifyPositionTypeVisible(typeLabel) {
  cy.contains(typeLabel).should('be.visible')
}

export function collapseProtocolAccordion(protocolName) {
  cy.contains(protocolName).scrollIntoView().click({ force: true })
}

export function expandProtocolAccordion(protocolName) {
  cy.contains(protocolName).scrollIntoView().click({ force: true })
}
