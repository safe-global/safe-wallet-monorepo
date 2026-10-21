/**
 * Every Playwright spec that runs against the isolated backend, by path under e2e/tests. `scenarios` names the
 * functions in scenarios/index.mjs that prepare the spec's data, once per spec file; `safes` maps each key of SAFES
 * in e2e/src/data/constants.ts that the spec reads to a static Safe key the scenarios return.
 */
export const playwrightSpecs = {
  'api/credentials.spec.ts': {},
  'e2e/ledger-sign-execute.spec.ts': {
    scenarios: ['prepareLedgerScenario'],
    safes: { SEP_LEDGER_SIGN_SAFE: 'SEP_STATIC_SAFE_48', SEP_LEDGER_EXECUTE_SAFE: 'SEP_STATIC_SAFE_49' },
  },
  'api/safe-info.api.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'e2e/batch.spec.ts': {},
  'e2e/bulk-execute.spec.ts': {},
  'e2e/delete.spec.ts': {},
  'e2e/erc20-transfer.spec.ts': {},
  'e2e/mass-payout.spec.ts': {},
  'e2e/multisig-confirm.spec.ts': {},
  'e2e/nft-transfer.spec.ts': {},
  'e2e/recovery.spec.ts': {},
  'e2e/reject.spec.ts': {},
  'e2e/replace.spec.ts': {},
  'e2e/sign-offchain-message.spec.ts': {},
  'e2e/spending-limit.spec.ts': {},
  'regression/email-sign-in.spec.ts': {},
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
  'regression/step-up-outside-workspace.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/step-up-workspace-actions.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/step-up-workspace-rename.spec.ts': {},
  'regression/step-up-auth.spec.ts': {},
  'smoke/balances.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_3', SEP_ASSETS_SAFE: 'SEP_STATIC_SAFE_2' },
  },
  'smoke/dashboard.spec.ts': { scenarios: ['prepareBasicScenario'], safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' } },
  'smoke/landing.spec.ts': {},
  'e2e/walletconnect.spec.ts': {},
  'e2e/walletconnect-nested-signer.spec.ts': {},
}
