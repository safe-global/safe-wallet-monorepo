// Phase 2 slice route smoke test — confirms the TanStack /welcome route boots
// the full provider tree and renders the reused apps/web NewSafe component.
describe('welcome (slice route)', () => {
  it('renders the welcome shell', () => {
    cy.visit('/welcome')
    cy.contains('Own your assets onchain securely', { timeout: 15000 }).should('be.visible')
  })
})
