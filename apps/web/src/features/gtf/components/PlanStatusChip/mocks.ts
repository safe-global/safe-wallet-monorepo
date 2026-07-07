import type { PlanStatus, PlanTier } from './types'

export const STARTER_TIER: PlanTier = {
  id: 'starter',
  name: 'Starter',
  priceMonthlyUsd: 0,
  features: ['Covers one Safe', '$5K/mo fee-free volume', 'Included by default', 'In-app support chat'],
}

export const PRO_TIER: PlanTier = {
  id: 'pro',
  name: 'Pro',
  priceMonthlyUsd: 49,
  features: ['Covers unlimited Safes', '$500K/mo fee-free volume', '15 gasless transactions', 'In-app support chat'],
}

export const PRO_PLUS_TIER: PlanTier = {
  id: 'pro-plus',
  name: 'Pro+',
  priceMonthlyUsd: 149,
  features: ['Covers unlimited Safes', '$5M/mo fee-free volume', '40 gasless transactions', 'In-app support chat'],
}

const ACTIVE_SAFES = [
  '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
]

const RENEWAL_DATE = '2026-06-01T12:00:00.000Z'

export const PLAN_STATUS_MOCKS = {
  noWorkspace: {
    belongsToWorkspace: false,
    planId: 'starter',
    planName: 'Starter',
    status: 'within_limit',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 0, total: 5_000 },
    activeSafes: [],
  },
  starterWithin: {
    belongsToWorkspace: true,
    planId: 'starter',
    planName: 'Starter',
    status: 'within_limit',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 2_500, total: 5_000 },
    activeSafes: [],
  },
  starterLimit: {
    belongsToWorkspace: true,
    planId: 'starter',
    planName: 'Starter',
    status: 'limit_reached',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 5_000, total: 5_000 },
    paygFeesThisPeriodUsd: 150,
    activeSafes: [],
  },
  proWithin: {
    belongsToWorkspace: true,
    planId: 'pro',
    planName: 'Pro',
    status: 'within_limit',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 200_000, total: 500_000 },
    gaslessTransactions: { used: 5, total: 15 },
    activeSafes: ACTIVE_SAFES,
  },
  proApproaching: {
    belongsToWorkspace: true,
    planId: 'pro',
    planName: 'Pro',
    status: 'approaching_limit',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 450_000, total: 500_000 },
    gaslessTransactions: { used: 5, total: 15 },
    activeSafes: ACTIVE_SAFES,
  },
  proLimit: {
    belongsToWorkspace: true,
    planId: 'pro',
    planName: 'Pro',
    status: 'limit_reached',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 520_000, total: 500_000 },
    gaslessTransactions: { used: 15, total: 15 },
    activeSafes: ACTIVE_SAFES,
  },
  proFailed: {
    belongsToWorkspace: true,
    planId: 'pro',
    planName: 'Pro',
    status: 'payment_failed',
    renewalDate: RENEWAL_DATE,
    feeFreeVolume: { used: 200_000, total: 500_000 },
    gaslessTransactions: { used: 5, total: 15 },
    activeSafes: ACTIVE_SAFES,
  },
} satisfies Record<string, PlanStatus>

export type PlanStatusPreview = keyof typeof PLAN_STATUS_MOCKS
