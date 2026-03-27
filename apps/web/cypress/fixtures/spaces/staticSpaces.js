/**
 * @fileoverview Staging E2E Space **id + name** registry (same import pattern as `fixtures/safes/static.js`).
 *
 * @example
 * import staticSpaces from '../../fixtures/spaces/staticSpaces.js'
 * space.visitSpaceDashboard(staticSpaces.dashboardWithSafes.id)
 * cy.contains(staticSpaces.dashboardWithSafes.name)
 *
 * | Key | Typical use |
 * |-----|-------------|
 * | `dashboardWithSafes` | Populated Space — Accounts, Pending, sidebar |
 * | `emptyGettingStarted` | No Safes — Getting started |
 */
export default {
  dashboardWithSafes: {
    id: '2343',
    name: 'Automation Test Space',
    /** Expected top-level account rows on the Space dashboard (`space-dashboard-accounts-row-*`). Align with CGW for this space. */
    accountsWidgetRowCount: 3,
    /** Row 0 — `verifySpaceDashboardAccountsRowSafeDetails` (name, address, Sepolia logo, balance regex). */
    row0PendingSafe: {
      name: 'Pending tx',
      address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
      /** Single-chain row — `AccountWidgetItem` owners badge (e.g. `2/3`). */
      ownersThreshold: '2/3',
    },
  },
  emptyGettingStarted: {
    id: '2362',
    name: 'Automation Empty Space',
  },
}
