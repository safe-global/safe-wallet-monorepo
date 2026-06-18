/**
 * @fileoverview Staging E2E Space **uuid + name** registry (same import pattern as `fixtures/safes/static.js`).
 *
 * @example
 * import staticSpaces from '../../fixtures/spaces/staticSpaces.js'
 * space.visitSpaceDashboard(staticSpaces.dashboardWithSafes.uuid)
 * cy.contains(staticSpaces.dashboardWithSafes.name)
 *
 * | Key | Typical use |
 * |-----|-------------|
 * | `dashboardWithSafes` | Populated Space — Accounts, Pending, sidebar |
 * | `emptyGettingStarted` | No Safes — Getting started |
 */
export default {
  dashboardWithSafes: {
    uuid: 'b0d9f2bd-48db-466e-95d0-a114a9e843e9',
    name: 'Automation Test Space',
    /** Expected top-level account rows on the Space dashboard (`space-dashboard-accounts-row-*`). Align with CGW for this space. */
    accountsWidgetRowCount: 9,
    /** Expected account rows on the Safe Accounts page (`safe-list-item`). Multi-chain Safes appear as one card each. */
    safeAccountsPageCount: 3,

    /** Row 0 — unnamed multichain Safe (no address book name). Displays shortened address as name. */
    unnamedAccount: {
      address: '0x1694CbDE1b30eEdd9f7A2b6C7e36A180F2a3a23C7',
      chainLogosCount: 2,
    },
    unnamedAccountRowIndex: 0,

    /** Row 1 — multichain Safe with address book name. Expandable with sub-account rows. */
    multichainAccount: {
      name: 'Space addressbook name',
      address: '0x0596186046753e57De38905C27a25F31b9e6197b',
      chainLogosCount: 4,
    },
    multichainAccountRowIndex: 1,
    multichainSubAccounts: [
      { chainId: '11155111', safeQueryIncludes: 'sep:' },
      { chainId: '137', safeQueryIncludes: 'matic:' },
      { chainId: '8453', safeQueryIncludes: 'base:' },
      { chainId: '1', safeQueryIncludes: 'eth:' },
    ],

    /**
     * Row 2 — single-chain “Pending tx” Safe — `verifySpaceDashboardAccountsRowSafeDetails` (name, address, Sepolia logo, balance regex).
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
  },
  emptyGettingStarted: {
    uuid: 'ca3d2ede-3492-4799-a4e9-bf0dcdd0c52f',
    name: 'Automation Empty Space',
  },
}
