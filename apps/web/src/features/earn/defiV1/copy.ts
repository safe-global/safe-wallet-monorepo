import type { DefiV1Framing, OpportunityCategory, RiskLevel } from './types'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatUsd = (value: number) => usd.format(value)
export const formatCompactUsd = (value: number) => compactUsd.format(value)
export const formatAmount = (value: number) => amount.format(value)
export const formatApy = (value: number) => percent.format(value)

export const formatLiveFor = (liveSince: string, today = new Date()): string => {
  const [year, month] = liveSince.split('-').map(Number)
  const months = (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month)
  if (months < 12) return `${Math.max(months, 1)} months`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''}`
}

export const DEFI_V1_COPY = {
  tabName: { treasury: 'Treasury', defi: 'DeFi' } satisfies Record<DefiV1Framing, string>,
  pageTitle: { treasury: 'Put idle cash to work', defi: 'DeFi opportunities' } satisfies Record<DefiV1Framing, string>,
  pageLead: {
    treasury:
      'A short list of vetted options, grouped by what your treasury needs. Exit time and who runs it come first.',
    defi: 'Lending, staking and tokenised funds you can use from this Safe. Filter by asset, network and exit time.',
  } satisfies Record<DefiV1Framing, string>,
  category: {
    cash: { title: 'Cash-like', subtitle: 'Exit within a day. For cash you may need soon.' },
    yield: { title: 'Enhanced yield', subtitle: 'A bit more yield for cash you can leave for a while.' },
    staking: { title: 'Staking', subtitle: 'Earn on ETH the treasury plans to hold.' },
  } satisfies Record<OpportunityCategory, { title: string; subtitle: string }>,
  risk: { low: 'Lower risk', medium: 'Medium risk', higher: 'Higher risk' } satisfies Record<RiskLevel, string>,
  more: (count: number) => `More options (${count})`,
  moreTitle: 'More options',
  moreLead: 'Options that passed the listing checks but are not on the shelf. Same facts, same format.',
  nudgeTitle: (value: string, asset: string, chain: string, days: number) =>
    `${value} ${asset} has been idle on ${chain} for ${days} days`,
  nudgeBody: (count: number) =>
    `${count} cash-like options let you exit the same day. Funds always return to this Safe.`,
  nudgeCta: 'See cash-like options',
  nudgeInline: (value: string, asset: string, days: number) => `${value} ${asset} idle for ${days} days`,
  nudgeInlineCta: 'Earn with same-day exit',
  proOnly: 'Safe Pro',
  kyc: 'KYC once',
  sponsored: 'Sponsored',
  featured: 'Featured',
  premium: 'Partner',
  locked: 'Available with Safe Pro',
  apyLabel: 'Current rate',
  exitLabel: 'Exit time',
  factSheet: {
    runBy: 'Run by',
    curator: 'Curator',
    audits: 'Audits',
    liveFor: 'Live for',
    exit: 'Exit time',
    kyc: 'KYC',
    chains: 'Networks',
    holds: 'What you hold',
    apy: 'Current rate',
    rateNote: 'Rates change. Past rates do not promise future ones.',
    thirdParty: (runBy: string) => `${runBy} runs this product, not Safe. Safe lists it after its listing checks.`,
    safeIsPaid: 'Safe is paid by this partner for this listing. It does not change its rank.',
    deposit: 'Deposit',
    kycYes: 'Required, done once with Safe Pro',
    kycNo: 'Not required',
  },
  deposit: {
    title: (name: string) => `Deposit into ${name}`,
    amount: 'Amount',
    from: 'Pay with',
    fromValue: (asset: string, chain: string, balance: string) => `${asset} on ${chain} · ${balance} available`,
    approve: 'What signers approve',
    approveLead: 'One proposal. Signers see these steps in plain words.',
    returnRule: 'Funds can only return to this Safe.',
    yearly: (value: string) => `About ${value} a year at the current rate`,
    threshold: (threshold: number, owners: number) => `Needs ${threshold} of ${owners} signers`,
    policy: (name: string) => `Within your "${name}" policy · 1 signer`,
    comingSoon: 'Coming soon',
    createProposal: 'Create proposal',
    depositNow: 'Deposit now',
    proposalCreated: 'Proposal created',
    proposalNext: (left: number) => `You signed. ${left} more signer${left > 1 ? 's' : ''} needed to deposit.`,
    deposited: 'Deposited',
    depositedNext: 'Your position will show up in a few minutes.',
    done: 'Done',
  },
  positions: {
    title: 'Your positions',
    principal: 'Deposited',
    earned: 'Earned',
    rate: 'Current rate',
    exit: 'Exit time',
    withdraw: 'Withdraw',
    pending: 'Awaiting signatures',
    withdrawTitle: (name: string) => `Withdraw from ${name}`,
    withdrawLead: 'Funds return to this Safe. Signers approve one proposal.',
  },
  policy: {
    title: 'Investment policy',
    lead: 'Signers approve a rule once. Then one signer can deposit and withdraw inside it, and funds only ever return to this Safe.',
    cta: 'Preview a policy',
    dialogTitle: 'Treasury cash policy',
    options: 'Allowed options',
    cap: 'Cap',
    who: 'Who can act',
    whoValue: (executors: number, owners: number) => `Any ${executors} of ${owners} signers`,
    returnRule: 'Funds only return to this Safe',
    sweep: 'Sweep idle cash',
    sweepValue: (value: string) => `Keep ${value} liquid, invest the rest every week`,
    approveOnce: (threshold: number, owners: number) => `Signers approve this once (${threshold} of ${owners})`,
    approve: 'Propose policy',
  },
  plan: {
    modelB: 'Safe Pro: lower fees on every deposit',
    feePlaceholder: 'Fee levels to be confirmed',
  },
} as const
