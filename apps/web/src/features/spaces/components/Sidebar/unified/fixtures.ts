import type { PlanState, SafeCount, Scenario } from './scenario'

export type MockSafe = { name: string; safe: string }

// Public Sepolia test Safes from cypress/fixtures/safes/static.js, so every page loads real data without login.
const SAFES: MockSafe[] = [
  { name: 'Treasury', safe: 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415' },
  { name: 'Ops payroll', safe: 'sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb' },
  { name: 'Grants', safe: 'sep:0x03042B890b99552b60A073F808100517fb148F60' },
  { name: 'Vesting', safe: 'sep:0x33C4AA5729D91FfB3B87AEf8a324bb6304Fb905c' },
  { name: 'Marketing', safe: 'sep:0xBb26E3717172d5000F87DeFd391994f789D80aEB' },
  { name: 'Market making', safe: 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7' },
  { name: 'Security council', safe: 'sep:0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F' },
  { name: 'Bug bounty', safe: 'sep:0x9190cc22D592dDcf396Fa616ce84a9978fD96Fc9' },
  { name: 'Liquidity', safe: 'sep:0x98705770aF3b18db0a64597F6d4DCe825915fec0' },
  { name: 'Reserve', safe: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01' },
  { name: 'Savings', safe: 'sep:0xFFfaC243A24EecE6553f0Da278322aCF1Fb6CeF1' },
  { name: 'Cold storage', safe: 'sep:0xe41D568F5040FD9adeE8B64200c6B7C363C68c41' },
]

export const getMockSafes = (count: SafeCount): MockSafe[] => SAFES.slice(0, count)

// My accounts. Treasury is in the Workspace too, as a Safe can be in both.
const PERSONAL_SAFES: MockSafe[] = [SAFES[0], SAFES[10], SAFES[11]]

export const getPersonalSafes = (): MockSafe[] => PERSONAL_SAFES

/** The open Safe's name, or a short address for a Safe outside the scenario (any bookmarked URL still works). */
export const getSafeName = (safe: string | undefined): string => {
  if (!safe) return 'Safe Account'
  const known = SAFES.find((s) => s.safe.toLowerCase() === safe.toLowerCase())
  if (known) return known.name
  const address = safe.split(':').pop() ?? safe
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export const WORKSPACE_NAME = 'Acme'

export const ACCOUNTS_NAME = 'My accounts'

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
