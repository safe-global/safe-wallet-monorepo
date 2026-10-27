import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  BLOCKED_SPENDING_LIMITS_DESCRIPTION,
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
      tone: 'warning',
      title: getBlockedSpendingLimitsTitle(1),
      description:
        "Payroll bot can send up to 1 ETH / week to any address today. Once this allowlist is active, it can't send ETH anymore.",
    },
    rows: [RESTRICTED_ROW, BLOCKED_ROW],
  },
} satisfies Meta<typeof Stateful>

export default meta
type Story = StoryObj<typeof meta>

/** One limit's token is left out of the allowlist, so it will be blocked; the other follows its rules. */
export const OneBlocked: Story = {}

export const SeveralBlocked: Story = {
  args: {
    banner: {
      tone: 'warning',
      title: getBlockedSpendingLimitsTitle(2),
      description: BLOCKED_SPENDING_LIMITS_DESCRIPTION,
    },
    rows: [BLOCKED_ROW, { ...BLOCKED_ROW, key: 'treasury-bot-dai', spender: spender('Treasury bot') }],
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
