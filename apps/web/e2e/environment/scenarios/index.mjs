import * as accounts from './accounts.mjs'
import * as assets from './assets.mjs'
import * as basic from './basic.mjs'
import * as batch from './batch.mjs'
import * as chains from './chains.mjs'
import * as counterfactual from './counterfactual.mjs'
import * as cow from './cow.mjs'
import * as creation from './creation.mjs'
import * as dashboard from './dashboard.mjs'
import * as fallbackHandlers from './fallback-handlers.mjs'
import * as history from './history.mjs'
import * as historySummary from './history-summary.mjs'
import * as ledger from './ledger.mjs'
import * as nested from './nested.mjs'
import * as notes from './notes.mjs'
import * as proposers from './proposers.mjs'
import * as recovery from './recovery.mjs'
import * as rejection from './rejection.mjs'
import * as replacement from './replacement.mjs'
import * as safeApps from './safe-apps.mjs'
import * as sharing from './sharing.mjs'
import * as spaces from './spaces.mjs'
import * as transferForm from './transfer-form.mjs'
import * as zerion from './zerion.mjs'

const modules = [
  accounts,
  assets,
  basic,
  batch,
  chains,
  counterfactual,
  cow,
  creation,
  dashboard,
  fallbackHandlers,
  history,
  historySummary,
  ledger,
  nested,
  notes,
  proposers,
  recovery,
  rejection,
  replacement,
  safeApps,
  sharing,
  spaces,
  transferForm,
  zerion,
]

/** The scenario functions by name; specs.mjs refers to them by these names. */
export const scenarios = Object.fromEntries(
  modules.flatMap((module) => Object.entries(module)).filter(([name]) => /^prepare\w+Scenario$/.test(name)),
)
