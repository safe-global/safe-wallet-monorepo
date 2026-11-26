/**
 * Every Playwright spec, by path under e2e/tests. `scenarios` names the functions in scenarios/index.mjs that prepare
 * the spec's data, once per spec file; the spec reads the Safes they return as `safes.<name>`. `chains` lists the
 * forks besides Sepolia that the spec needs, and `devices` the device emulators (deviceProfiles in local-stack.mjs).
 * `flags` lists the feature flags (apps/web/config/remote-config.json) whose feature the spec covers; the PR that
 * releases one of them runs these specs several times.
 * In CI, the stack of a Playwright shard starts the forks and emulators of the specs in that shard only.
 */
export const playwrightSpecs = {
  'e2e/ledger-sign-execute.spec.ts': {
    scenarios: ['prepareLedgerScenario'],
    devices: ['ledger'],
  },
  'e2e/trezor-sign-execute.spec.ts': {
    scenarios: ['prepareTrezorScenario'],
    devices: ['trezor'],
  },
  'e2e/batch.spec.ts': { flags: ['BATCHING'] },
  'e2e/billing.spec.ts': { scenarios: ['prepareBasicScenario'] },
  'e2e/bulk-execute.spec.ts': {},
  'e2e/connected-non-owner.spec.ts': {},
  'e2e/contract-signature-execute.spec.ts': {},
  'e2e/create-safe.spec.ts': {},
  'e2e/delete.spec.ts': { flags: ['DELETE_TX'] },
  'e2e/ens.spec.ts': { flags: ['DOMAIN_LOOKUP'] },
  'e2e/erc20-transfer.spec.ts': {},
  'e2e/fees.spec.ts': {},
  'e2e/load-safe.spec.ts': {},
  'e2e/mass-payout.spec.ts': { flags: ['MASS_PAYOUTS'] },
  'e2e/multichain-add-network.spec.ts': { chains: [1], flags: ['MULTI_CHAIN_SAFE_ADD_NETWORK'] },
  'e2e/multichain-create-safe.spec.ts': { chains: [1], flags: ['MULTI_CHAIN_SAFE_CREATION'] },
  'e2e/multisig-confirm.spec.ts': {},
  'e2e/nft-transfer.spec.ts': { flags: ['ERC721'] },
  'e2e/owner-management.spec.ts': {},
  'e2e/pay-from-safe.spec.ts': {},
  'e2e/policies.spec.ts': { flags: ['POLICIES'] },
  'e2e/workspace.spec.ts': { flags: ['WORKSPACE_ONBOARDING_V2'] },
  'e2e/positions.spec.ts': {
    scenarios: ['prepareZerionPositionsScenario'],
    chains: [1],
    flags: ['POSITIONS'],
  },
  'e2e/proposer.spec.ts': { flags: ['PROPOSERS'] },
  'e2e/proposer-settings.spec.ts': { flags: ['PROPOSERS'] },
  'e2e/recovery.spec.ts': { flags: ['RECOVERY'] },
  'e2e/reject.spec.ts': {},
  'e2e/relay.spec.ts': {},
  'e2e/replace.spec.ts': {},
  'e2e/safe-shield-recipient.spec.ts': {},
  'e2e/safe-shield-untrusted-safe.spec.ts': {},
  'e2e/sign-offchain-message.spec.ts': {},
  'e2e/spending-limit.spec.ts': { flags: ['SPENDING_LIMIT'] },
  'e2e/workspace-safe-spending-limit.spec.ts': { flags: ['SPENDING_LIMIT'] },
  'e2e/tx-history-filter.spec.ts': {},
  'e2e/portfolio.spec.ts': {
    scenarios: ['prepareZerionPortfolioScenario'],
    chains: [1],
    flags: ['PORTFOLIO_ENDPOINT'],
  },
  'e2e/token-lists.spec.ts': {
    scenarios: ['prepareBalancesEndpointsScenario'],
    chains: [1],
    flags: ['DEFAULT_TOKENLIST'],
  },
  'e2e/tx-builder.spec.ts': { flags: ['SAFE_APPS'] },
  'e2e/drain-account.spec.ts': {},
  'regression/auth0/email-sign-in.spec.ts': {},
  'regression/address-book.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
  },
  'regression/assets-table.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
  },
  'regression/dashboard-mastercopy-warning.spec.ts': {
    scenarios: ['prepareMastercopyScenario'],
  },
  'regression/recipient-dropdown-caret-toggle.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
  },
  'regression/recipient-dropdown-network-filter.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
  },
  'regression/recipient-dropdown-random-selection.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
  },
  'regression/safe-banned-legal-message.spec.ts': {
    scenarios: ['prepareBasicScenario'],
  },
  'regression/send-form-keyboard-navigation.spec.ts': {
    scenarios: ['prepareTransferFormScenario'],
  },
  'regression/wallet-reconnect.spec.ts': {
    scenarios: ['prepareBasicScenario'],
  },
  'regression/auth0/step-up-billing.spec.ts': { flags: ['WORKSPACE_ONBOARDING_V2'] },
  'regression/auth0/step-up-outside-workspace.spec.ts': {
    scenarios: ['prepareBasicScenario'],
  },
  'regression/auth0/step-up-workspace-rename.spec.ts': {},
  'regression/auth0/workspace-invite.spec.ts': {},
  'regression/workspace-address-book.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    flags: ['WORKSPACES_ADDRESS_BOOK_V2'],
  },
  'regression/workspace-tour-after-checkout.spec.ts': {},
  'regression/step-up-auth.spec.ts': {},
  'smoke/balances.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
  },
  'smoke/dashboard.spec.ts': {
    scenarios: ['prepareBasicScenario', 'prepareDashboardScenario'],
  },
  'smoke/landing.spec.ts': {},
  'smoke/tx-history.spec.ts': {
    scenarios: ['prepareBasicScenario'],
  },
  'e2e/walletconnect.spec.ts': { flags: ['NATIVE_WALLETCONNECT'] },
  'e2e/walletconnect-nested-signer.spec.ts': { flags: ['NATIVE_WALLETCONNECT', 'NESTED_SAFES'] },
  'e2e/nested-signer.spec.ts': { flags: ['NESTED_SAFES'] },
  'e2e/nested-safe-create.spec.ts': { flags: ['NESTED_SAFES'] },
}
