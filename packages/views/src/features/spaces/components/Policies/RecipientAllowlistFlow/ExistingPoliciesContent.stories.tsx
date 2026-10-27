import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { RESTRICTED_SPENDING_LIMITS_DESCRIPTION } from './constants'
import ExistingPoliciesContent, { type ExistingPoliciesContentProps } from './ExistingPoliciesContent'

const spender = (name: string) => <Typography variant="paragraph-small-medium">{name}</Typography>

const ROWS: ExistingPoliciesContentProps['rows'] = [
  {
    key: 'ops-bot-usdc',
    spender: spender('Ops bot'),
    description: '500/day · USDC is in this allowlist',
    restricted: true,
  },
  {
    key: 'payroll-bot-eth',
    spender: spender('Payroll bot'),
    description: "1/week · ETH isn't in this allowlist",
    restricted: false,
  },
]

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
    description:
      'Ops bot can send USDC to any address today, up to 500/day. Once this allowlist is active, it can only send USDC to the 4 allowed recipients.',
    rows: ROWS,
  },
} satisfies Meta<typeof Stateful>

export default meta
type Story = StoryObj<typeof meta>

/** One spending limit on an allowlisted token is restricted; the other token is outside the allowlist. */
export const OneRestricted: Story = {}

export const AllRestricted: Story = {
  args: {
    description: RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
    rows: [ROWS[0], { ...ROWS[0], key: 'treasury-bot-usdc', spender: spender('Treasury bot') }],
  },
}
