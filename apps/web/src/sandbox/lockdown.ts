import 'ses'

let done = false

/** Freezes the JavaScript intrinsics in the browser so view compartments cannot change them. */
export function ensureLockdown(): void {
  if (done || typeof window === 'undefined' || process.env.NODE_ENV === 'test') return
  done = true
  lockdown({
    errorTaming: 'unsafe',
    stackFiltering: 'verbose',
    overrideTaming: 'severe',
    consoleTaming: 'unsafe',
    localeTaming: 'unsafe',
    evalTaming: process.env.NODE_ENV === 'development' ? 'unsafe-eval' : 'safe-eval',
    domainTaming: 'unsafe',
    reporting: 'console',
  })
}

ensureLockdown()
