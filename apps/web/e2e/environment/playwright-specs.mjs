/**
 * Every Playwright spec that runs against the isolated backend, by path under e2e/tests. `scenarios` names the
 * functions in scenarios/index.mjs that prepare the spec's data, once per spec file; `safes` maps each key of SAFES
 * in e2e/src/data/constants.ts that the spec reads to a static Safe key the scenarios return.
 */
export const playwrightSpecs = {
  'api/credentials.spec.ts': {},
  'api/safe-info.api.spec.ts': {
    scenarios: ['prepareBasicScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' },
  },
  'regression/assets-table.spec.ts': {
    scenarios: ['prepareAssetsScenario', 'prepareProposersScenario'],
    safes: { SEP_ASSETS_SAFE: 'SEP_STATIC_SAFE_2', SEP_PROPOSER_SAFE: 'SEP_STATIC_SAFE_31' },
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
  'regression/spaces-members-table.spec.ts': {},
  'regression/step-up-auth.spec.ts': {},
  'smoke/balances.spec.ts': {
    scenarios: ['prepareAssetsScenario'],
    safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_3', SEP_ASSETS_SAFE: 'SEP_STATIC_SAFE_2' },
  },
  'smoke/dashboard.spec.ts': { scenarios: ['prepareBasicScenario'], safes: { SEP_STATIC_SAFE_1: 'SEP_STATIC_SAFE_0' } },
  'smoke/landing.spec.ts': {},
}
