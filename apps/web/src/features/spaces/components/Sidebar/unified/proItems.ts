import type { ComponentType } from 'react'
import { History, Landmark, ListChecks, Shield, UsersRound } from 'lucide-react'
import { AppRoutes } from '@/config/routes'

export type ProItemKey = 'policies' | 'activity' | 'security' | 'members' | 'plan'

export type ProItem = {
  key: ProItemKey
  label: string
  icon: ComponentType<{ className?: string }>
  /** The production page it stands for; the prototype can't open it without sign-in. */
  route: string
  what: string
  example: (safeName: string, otherSafeName: string) => string
  preview: string[]
}

export const PRO_ITEMS: ProItem[] = [
  {
    key: 'policies',
    label: 'Policies',
    icon: Landmark,
    route: AppRoutes.spaces.policies,
    what: 'Rules your Safes follow before anything is sent.',
    example: (safe) => `Let ${safe} send up to 10,000 USDC a day to known addresses, and flag the rest.`,
    preview: ['Spending limits per token and period', 'Allowlists for recipients', 'Who can propose transactions'],
  },
  {
    key: 'activity',
    label: 'Activity log',
    icon: History,
    route: AppRoutes.spaces.activity,
    what: 'A record of who did what in your Workspace, and when.',
    example: (safe) => `See who changed the ${safe} signers last week.`,
    preview: ['Member and Safe changes', 'Exports for audits', 'Filter by person and date'],
  },
  {
    key: 'security',
    label: 'Security Hub',
    icon: Shield,
    route: AppRoutes.spaces.security,
    what: 'Security checks for all your Safes in one place.',
    example: (safe) => `Get told when ${safe} has an outdated module or a risky owner setup.`,
    preview: ['Setup checks per Safe', 'Threat analysis on new transactions', 'Workspace 2FA'],
  },
  {
    key: 'members',
    label: 'Members',
    icon: UsersRound,
    route: AppRoutes.spaces.members,
    what: 'Invite your team, with admin and member roles.',
    example: (safe) => `Give your finance lead a view of ${safe} without making them a signer.`,
    preview: ['Admin and member roles', 'Invite by email or wallet', 'Unlimited members'],
  },
  {
    key: 'plan',
    label: 'Plan',
    icon: ListChecks,
    route: AppRoutes.spaces.plans,
    what: 'Your plan, your trial and billing.',
    example: () => 'Start a 30-day trial. No card needed, and nothing changes for your Safes.',
    preview: ['Free, Starter, Business and Enterprise', 'Compare features', 'Billing for admins'],
  },
]

/** The Safe Pro group, in order. Plan lives in the workspace switcher. */
export const PRO_GROUP_KEYS: ProItemKey[] = ['policies', 'activity', 'security', 'members']

export const getProItem = (key: string | undefined): ProItem | undefined => PRO_ITEMS.find((item) => item.key === key)

export const PREVIEW_ROUTE = '/prototypes/pro-preview'
