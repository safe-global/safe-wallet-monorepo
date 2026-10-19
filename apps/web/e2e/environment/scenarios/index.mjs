import * as accounts from './accounts.mjs'
import * as assets from './assets.mjs'
import * as basic from './basic.mjs'
import * as batch from './batch.mjs'
import * as bulk from './bulk.mjs'
import * as chains from './chains.mjs'
import * as counterfactual from './counterfactual.mjs'
import * as cow from './cow.mjs'
import * as creation from './creation.mjs'
import * as dashboard from './dashboard.mjs'
import * as deletion from './deletion.mjs'
import * as fallbackHandlers from './fallback-handlers.mjs'
import * as happypath from './happypath.mjs'
import * as history from './history.mjs'
import * as historyFilters from './history-filters.mjs'
import * as historySmoke from './history-smoke.mjs'
import * as historySummary from './history-summary.mjs'
import * as messages from './messages.mjs'
import * as nested from './nested.mjs'
import * as nfts from './nfts.mjs'
import * as notes from './notes.mjs'
import * as owners from './owners.mjs'
import * as proposers from './proposers.mjs'
import * as recovery from './recovery.mjs'
import * as rejection from './rejection.mjs'
import * as replacement from './replacement.mjs'
import * as safeApps from './safe-apps.mjs'
import * as sharing from './sharing.mjs'
import * as spaces from './spaces.mjs'
import * as spendingLimits from './spending-limits.mjs'
import * as transferForm from './transfer-form.mjs'

const modules = [
  accounts,
  assets,
  basic,
  batch,
  bulk,
  chains,
  counterfactual,
  cow,
  creation,
  dashboard,
  deletion,
  fallbackHandlers,
  happypath,
  history,
  historyFilters,
  historySmoke,
  historySummary,
  messages,
  nested,
  nfts,
  notes,
  owners,
  proposers,
  recovery,
  rejection,
  replacement,
  safeApps,
  sharing,
  spaces,
  spendingLimits,
  transferForm,
]

/** The scenario functions by name; specs.mjs refers to them by these names. */
export const scenarios = Object.fromEntries(
  modules.flatMap((module) => Object.entries(module)).filter(([name]) => /^prepare\w+Scenario$/.test(name)),
)
