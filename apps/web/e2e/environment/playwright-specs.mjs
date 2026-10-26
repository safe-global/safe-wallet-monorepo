/**
 * Every Playwright spec that runs against the isolated backend, by path under e2e/tests. `scenarios` names the
 * functions in scenarios/index.mjs that prepare the spec's data, once per spec file; `safes` maps each key of SAFES
 * in e2e/src/data/constants.ts that the spec reads to a static Safe key the scenarios return. `chains` lists the forks
 * besides Sepolia that the spec needs; the stack of the Playwright job starts them.
 */
export const playwrightSpecs = {
  'e2e/ledger-sign-execute.spec.ts': {
    scenarios: ['prepareLedgerScenario'],
    safes: { SEP_LEDGER_SIGN_SAFE: 'SEP_STATIC_SAFE_48', SEP_LEDGER_EXECUTE_SAFE: 'SEP_STATIC_SAFE_49' },
  },
  'e2e/batch.spec.ts': {},
  'e2e/bulk-execute.spec.ts': {},
  'e2e/connected-non-owner.spec.ts': {},
  'e2e/contract-signature-execute.spec.ts': {},
  'e2e/create-safe.spec.ts': {},
  'e2e/delete.spec.ts': {},
  'e2e/ens.spec.ts': {},
  'e2e/erc20-transfer.spec.ts': {},
  'e2e/load-safe.spec.ts': {},
  'e2e/mass-payout.spec.ts': {},
  'e2e/multichain-add-network.spec.ts': { chains: [1] },
  'e2e/multichain-create-safe.spec.ts': { chains: [1] },
  'e2e/multisig-confirm.spec.ts': {},
  'e2e/nft-transfer.spec.ts': {},
  'e2e/owner-management.spec.ts': {},
  'e2e/policies.spec.ts': {},
  'e2e/proposer.spec.ts': {},
  'e2e/proposer-settings.spec.ts': {},
  'e2e/recovery.spec.ts': {},
  'e2e/reject.spec.ts': {},
  'e2e/relay.spec.ts': {},
  'e2e/replace.spec.ts': {},
  'e2e/sign-offchain-message.spec.ts': {},
  'e2e/spending-limit.spec.ts': {},
  'e2e/tx-history-filter.spec.ts': {},
  'e2e/portfolio.spec.ts': {
    scenarios: ['prepareZerionPortfolioScenario'],
    safes: { ETH_ZERION_SAFE: 'ETH_ZERION_SAFE' },
    chains: [1],
  },
  'e2e/token-lists.spec.ts': {
    scenarios: ['prepareBalancesEndpointsScenario'],
    safes: { ETH_TOKEN_LIST_SAFE: 'ETH_STATIC_SAFE_15' },
    chains: [1],
  },
  'e2e/tx-builder.spec.ts': {},
  'regression/auth0/email-sign-in.spec.ts': {},
  'regression/assets-table.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
    safes: { SEP_ASSETS_SAFE: 'SEP_STATIC_SAFE_2' },
  },
  'regression/recipient-dropdown-caret-toggle.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
    safes: { SEP_OWNER_4_SAFE: 'SEP_STATIC_SAFE_6' },
  },
  'regression/recipient-dropdown-network-filter.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
    safes: { SEP_OWNER_4_SAFE: 'SEP_STATIC_SAFE_6' },
  },
  'regression/recipient-dropdown-random-selection.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
    safes: { SEP_OWNER_4_SAFE: 'SEP_STATIC_SAFE_6' },
  },
  'regression/safe-banned-legal-message.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_2: 'SEP_STATIC_SAFE_0' },
  },
  'regression/send-form-keyboard-navigation.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
    safes: { SEP_OWNER_4_SAFE: 'SEP_STATIC_SAFE_6' },
  },
  'regression/auth0/step-up-billing.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/auth0/step-up-outside-workspace.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/auth0/step-up-workspace-actions.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/auth0/step-up-workspace-rename.spec.ts': {},
  'regression/step-up-auth.spec.ts': {},
  'smoke/balances.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_3', SEP_ASSETS_SAFE: 'SEP_STATIC_SAFE_2' },
  },
  'smoke/dashboard.spec.ts': {
    // Both scenarios return SEP_STATIC_SAFE_2; the last one wins, so the Safe with the queue comes last.
    scenarios: ['prepareBasicScenario', 'prepareDashboardScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0', SEP_QUEUE_SAFE: 'SEP_STATIC_SAFE_2' },
  },
  'smoke/landing.spec.ts': {},
  // The basic Safe's history holds its creation, a "Success" row
  'smoke/tx-history.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_HISTORY_SAFE: 'SEP_STATIC_SAFE_7' },
  },
  'e2e/walletconnect.spec.ts': {},
  'e2e/walletconnect-nested-signer.spec.ts': {},
  'e2e/nested-signer.spec.ts': {},
  'e2e/nested-safe-create.spec.ts': {},
}
