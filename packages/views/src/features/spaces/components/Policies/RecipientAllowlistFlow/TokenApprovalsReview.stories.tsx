import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import TokenApprovalsReview from './TokenApprovalsReview'
import {
  NO_TOKEN_APPROVALS_TITLE,
  RETRY_LABEL,
  TOKEN_APPROVALS_INCOMPLETE_TITLE,
  TOKEN_APPROVALS_LOAD_ERROR_TITLE,
  TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
  TOKEN_APPROVALS_UNLIMITED,
} from './constants'

const label = (text: string) => <Typography variant="paragraph-small-medium">{text}</Typography>

const rows = [
  { key: 'usdc', token: label('USDC'), spender: label('Uniswap router'), amount: TOKEN_APPROVALS_UNLIMITED },
  { key: 'weth', token: label('WETH'), spender: label('0x1De7…0B2'), amount: '1.5 WETH' },
]

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/TokenApprovalsReview',
  component: TokenApprovalsReview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
  args: { rows },
} satisfies Meta<typeof TokenApprovalsReview>

export default meta
type Story = StoryObj<typeof meta>

/** The setup revokes every listed approval. */
export const Listed: Story = {}

export const NoApprovals: Story = {
  args: { rows: [], notice: { tone: 'success', title: NO_TOKEN_APPROVALS_TITLE } },
}

/** The gateway could not make sure that it found every approval. */
export const Incomplete: Story = {
  args: {
    notice: {
      tone: 'warning',
      title: TOKEN_APPROVALS_INCOMPLETE_TITLE,
      description: TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
    },
  },
}

export const LoadError: Story = {
  args: {
    rows: [],
    notice: {
      tone: 'warning',
      title: TOKEN_APPROVALS_LOAD_ERROR_TITLE,
      description: TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
      action: (
        <Button variant="outline" size="sm">
          {RETRY_LABEL}
        </Button>
      ),
    },
  },
}
