import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  getBlockedSpendingLimitDescription,
  getBlockedSpendingLimitsTitle,
  getRestrictedSpendingLimitsTitle,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
} from './constants'
import ExistingPoliciesContent, { type ExistingPoliciesContentProps } from './ExistingPoliciesContent'

const spender = (name: string) => <Typography variant="paragraph-small-medium">{name}</Typography>

const RESTRICTED_ROW: ExistingPoliciesContentProps['rows'][number] = {
  key: 'ops-bot-usdc',
  spender: spender('Ops bot'),
  description: '500/day · USDC is in this allowlist',
  impact: 'restricted',
}

const BLOCKED_ROW: ExistingPoliciesContentProps['rows'][number] = {
  key: 'payroll-bot-eth',
  spender: spender('Payroll bot'),
  description: "1/week · ETH isn't in this allowlist",
  impact: 'blocked',
}

const Stateful = (props: Omit<ExistingPoliciesContentProps, 'acknowledged' | 'onAcknowledgedChange'>): ReactElement => {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div className="flex w-[640px] flex-col gap-5 rounded-2xl bg-card p-6">
      <ExistingPoliciesContent {...props} acknowledged={acknowledged} onAcknowledgedChange={setAcknowledged} />
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/ExistingPoliciesContent',
  component: Stateful,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    safeName: 'Payments',
    banner: {
      tone: 'info',
      title: getRestrictedSpendingLimitsTitle(1),
      description: RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
    },
    rows: [RESTRICTED_ROW],
  },
} satisfies Meta<typeof Stateful>

export default meta
type Story = StoryObj<typeof meta>

/** The Safe's only spending limit is on an allowlisted token, so it follows the allowlist's rules. */
export const OneRestricted: Story = {}

/** One limit's token is in the allowlist and comes first; the other's is left out, so the guard blocks that limit. */
export const PartlyBlocked: Story = {
  args: {
    banner: {
      tone: 'warning',
      title: getBlockedSpendingLimitsTitle(1),
      description: getBlockedSpendingLimitDescription('Payroll bot', '1 ETH / week', 'ETH'),
    },
    rows: [RESTRICTED_ROW, BLOCKED_ROW],
  },
}

/** Every limit's token is in the allowlist, so they all follow its rules. */
export const AllRestricted: Story = {
  args: {
    banner: {
      tone: 'info',
      title: getRestrictedSpendingLimitsTitle(2),
      description: RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
    },
    rows: [RESTRICTED_ROW, { ...RESTRICTED_ROW, key: 'treasury-bot-usdc', spender: spender('Treasury bot') }],
  },
}
