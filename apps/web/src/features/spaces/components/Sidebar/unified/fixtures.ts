import type { Context, PlanState, SafeCount, Scenario } from './scenario'

/** `safe` is the URL form, `<chain>:<address>`. Threshold, owners and balance are made up. */
export type MockSafe = { name: string; safe: string; threshold: number; owners: number; balance: number }

// Public Sepolia test Safes from cypress/fixtures/safes/static.js, so every page loads real data without login.
const SAFES: MockSafe[] = [
  {
    name: 'Treasury',
    safe: 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
    threshold: 3,
    owners: 5,
    balance: 1264300,
  },
  {
    name: 'Ops payroll',
    safe: 'sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
    threshold: 2,
    owners: 3,
    balance: 182450,
  },
  { name: 'Grants', safe: 'sep:0x03042B890b99552b60A073F808100517fb148F60', threshold: 2, owners: 4, balance: 96020 },
  { name: 'Vesting', safe: 'sep:0x33C4AA5729D91FfB3B87AEf8a324bb6304Fb905c', threshold: 3, owners: 4, balance: 740000 },
  {
    name: 'Marketing',
    safe: 'sep:0xBb26E3717172d5000F87DeFd391994f789D80aEB',
    threshold: 2,
    owners: 3,
    balance: 41800,
  },
  {
    name: 'Market making',
    safe: 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7',
    threshold: 2,
    owners: 2,
    balance: 310500,
  },
  {
    name: 'Security council',
    safe: 'sep:0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F',
    threshold: 4,
    owners: 7,
    balance: 12900,
  },
  {
    name: 'Bug bounty',
    safe: 'sep:0x9190cc22D592dDcf396Fa616ce84a9978fD96Fc9',
    threshold: 2,
    owners: 3,
    balance: 58000,
  },
  {
    name: 'Liquidity',
    safe: 'sep:0x98705770aF3b18db0a64597F6d4DCe825915fec0',
    threshold: 3,
    owners: 5,
    balance: 502700,
  },
  { name: 'Reserve', safe: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01', threshold: 3, owners: 5, balance: 880000 },
  { name: 'Savings', safe: 'sep:0xFFfaC243A24EecE6553f0Da278322aCF1Fb6CeF1', threshold: 1, owners: 2, balance: 23450 },
  {
    name: 'Cold storage',
    safe: 'sep:0xe41D568F5040FD9adeE8B64200c6B7C363C68c41',
    threshold: 2,
    owners: 3,
    balance: 154000,
  },
]

export const getMockSafes = (count: SafeCount): MockSafe[] => SAFES.slice(0, count)

// My accounts. Treasury comes first and is in the Workspace too, as a Safe can be in both.
const PERSONAL_ORDER = [0, 10, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export const getPersonalSafes = (count: SafeCount = 3): MockSafe[] =>
  PERSONAL_ORDER.slice(0, count).map((index) => SAFES[index])

const isSameSafe = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

export const findMockSafe = (safe: string | undefined): MockSafe | undefined =>
  safe ? SAFES.find((s) => isSameSafe(s.safe, safe)) : undefined

/** The address part of `<chain>:<address>`. */
export const getSafeAddress = (safe: string): string => safe.split(':').pop() ?? safe

export const formatSafeCount = (count: number): string => `${count} ${count === 1 ? 'Safe' : 'Safes'}`

/** The open Safe's name, or a short address for a Safe outside the scenario (any bookmarked URL still works). */
export const getSafeName = (safe: string | undefined): string => {
  if (!safe) return 'Safe Account'
  const known = findMockSafe(safe)
  if (known) return known.name
  const address = getSafeAddress(safe)
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** `sep:0xBd69…6415`, or the whole `<chain>:<address>` when `isFull`. */
export const formatSafeAddress = (safe: string, isFull = false): string => {
  if (isFull) return safe
  const [prefix, address = ''] = safe.includes(':') ? safe.split(':') : ['', safe]
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  return prefix ? `${prefix}:${short}` : short
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatBalance = (amount: number): string => usd.format(amount)

export const WORKSPACE_NAME = 'Acme'

export const ACCOUNTS_NAME = 'My accounts'

/** Made up: no Workspace has this id. */
export const MOCK_SPACE_ID = '00000000-0000-4000-8000-000000000042'

export const REASSURANCE = 'Your Safe Accounts stay free and fully yours.'

export const TRIAL_CTA = 'Try Pro free for 30 days, no card'

const TRIAL_ENDS: Partial<Record<PlanState, string>> = {
  trial: 'Nov 6',
  'trial-3': 'Nov 1',
  'trial-last': 'today',
}

export type PlanSummary = {
  /** Short line under the Workspace name in the switcher. */
  label: string
  /** Shorter still, for where the Safe count sits beside it. */
  short?: string
  /** The plan includes the Workspace items. */
  hasPro: boolean
  tone: 'neutral' | 'pro' | 'warning'
  /** One line for the switcher menu and the Plan item. */
  detail: string
}

export const getPlanSummary = (plan: PlanState, safeCount: SafeCount): PlanSummary => {
  switch (plan) {
    case 'free':
      return { label: 'Free', hasPro: false, tone: 'neutral', detail: 'Safe Pro features are not on your plan.' }
    case 'trial':
      return {
        label: `Pro trial · ends ${TRIAL_ENDS.trial}`,
        hasPro: true,
        tone: 'pro',
        detail: 'All Pro features, free until Nov 6.',
      }
    case 'trial-3':
      return {
        label: '3 days left in trial',
        hasPro: true,
        tone: 'warning',
        detail: `Your Pro trial ends ${TRIAL_ENDS['trial-3']}.`,
      }
    case 'trial-last':
      return { label: 'Pro trial ends today', hasPro: true, tone: 'warning', detail: 'Your Pro trial ends today.' }
    case 'paid':
      return {
        label: `Business · ${Math.max(safeCount, 10)} Safes`,
        short: 'Pro · Business',
        hasPro: true,
        tone: 'pro',
        detail: 'Business plan, renews Nov 29.',
      }
    case 'trial-ended':
      return {
        label: 'Free · trial ended',
        hasPro: false,
        tone: 'neutral',
        detail: 'Your Pro trial ended Oct 27. Your Workspace data is kept for 90 days.',
      }
  }
}

export const ACCOUNTS_SUMMARY: PlanSummary = {
  label: 'Free',
  hasPro: false,
  tone: 'neutral',
  detail: 'The Safe Accounts you own or watch. Free, with no workspace needed.',
}

/** A Workspace exists once a Pro trial has started, so Free has only My accounts. */
export const hasWorkspace = (plan: PlanState): boolean => plan !== 'free'

export const isInWorkspace = ({ plan, context }: Scenario): boolean => hasWorkspace(plan) && context === 'workspace'

/** What the open context includes: My accounts is always Free, the Workspace follows its plan. */
export const getActiveSummary = (scenario: Scenario): PlanSummary =>
  isInWorkspace(scenario) ? getPlanSummary(scenario.plan, scenario.safes) : ACCOUNTS_SUMMARY

/** A row of the workspace switcher: My accounts (the free workspace) or the Workspace. */
export type MockWorkspace = { context: Context; name: string; summary: PlanSummary; safes: MockSafe[] }

export const getMockWorkspaces = ({ plan, safes }: Scenario): MockWorkspace[] => [
  { context: 'accounts', name: ACCOUNTS_NAME, summary: ACCOUNTS_SUMMARY, safes: getPersonalSafes(safes) },
  ...(hasWorkspace(plan)
    ? [
        {
          context: 'workspace' as const,
          name: WORKSPACE_NAME,
          summary: getPlanSummary(plan, safes),
          safes: getMockSafes(safes),
        },
      ]
    : []),
]
