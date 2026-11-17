import * as assets from './assets.mjs'
import * as basic from './basic.mjs'
import * as chains from './chains.mjs'
import * as dashboard from './dashboard.mjs'
import * as ledger from './ledger.mjs'
import * as proposers from './proposers.mjs'
import * as recovery from './recovery.mjs'
import * as safeApps from './safe-apps.mjs'
import * as transferForm from './transfer-form.mjs'
import * as trezor from './trezor.mjs'
import * as zerion from './zerion.mjs'

const modules = [assets, basic, chains, dashboard, ledger, proposers, recovery, safeApps, transferForm, trezor, zerion]

/** The scenario functions by name; playwright-specs.mjs refers to them by these names. */
export const scenarios = Object.fromEntries(
  modules.flatMap((module) => Object.entries(module)).filter(([name]) => /^prepare\w+Scenario$/.test(name)),
)

/** The names of the Safes that each scenario returns; specs read them as `safes.<name>`. */
export const scenarioSafes = {
  prepareAssetsScenario: ['assets'],
  prepareBalancesEndpointsScenario: ['tokenLists'],
  prepareBasicScenario: ['basic'],
  prepareDashboardScenario: ['queue'],
  prepareLedgerScenario: ['ledgerSign', 'ledgerExecute'],
  prepareMastercopyScenario: ['migratable', 'unofficialSingleton'],
  prepareTransferFormScenario: ['transferForm'],
  prepareTrezorScenario: ['trezorSign', 'trezorExecute'],
  prepareZerionPortfolioScenario: ['portfolio'],
  prepareZerionPositionsScenario: ['positions'],
}
