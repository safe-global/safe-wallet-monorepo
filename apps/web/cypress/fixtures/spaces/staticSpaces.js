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
    /**
     * Row 2 — single-chain “Pending tx” Safe — `verifySpaceDashboardAccountsRowSafeDetails` (name, address, Sepolia logo, balance regex).
     * Order on dashboard: row 0 = unnamed `0x1694…`, row 1 = address book name, row 2 = this row.
     */
    pendingTxAccount: {
      name: 'Pending tx',
      address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
      /** EIP-3770 short name for `safe=` query and `SafeSelectorTriggerContent` address line (`sep:0x…`). */
      chainShortName: 'sep',
      /** Decoded `safe` query on `/home` after opening this Safe from the Accounts widget. */
      safeUrlParam: 'sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
      /** Single-chain row — `AccountWidgetItem` owners badge (e.g. `2/3`). */
      ownersThreshold: '2/3',
    },
    /** `AccountWidgetItem` row index — single-chain Pending tx row; click opens `/home?safe=…`. */
    singleChainAccountRowIndex: 2,
    /**
     * `ExpandableAccountItem` row (`safes.length > 1`) — first row (0x1694…) has two chains; sub-rows share `data-testid="sub-account-row"`.
     * Align `subAccounts` order with CGW for this space.
     */
    multichainAccountRowIndex: 0,
    multichainSubAccounts: [
      { chainId: '11155111', safeQueryIncludes: 'sep:' },
      { chainId: '137', safeQueryIncludes: 'matic:' },
    ],
  },
  emptyGettingStarted: {
    id: '2362',
    name: 'Automation Empty Space',
  },
}
