import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Box } from '@mui/material'
import { DeadlockStatus } from '@safe-global/utils/features/safe-shield/types'
import type { DeadlockCheckResult } from '@safe-global/utils/features/safe-shield/types'
import { withMockProvider } from '@/storybook/preview'
import DeadlockAnalysisCard from './index'

const meta = {
  title: 'Features/SafeShield/DeadlockAnalysisCard',
  component: DeadlockAnalysisCard,
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 350 }}>
        <Story />
      </Box>
    ),
    withMockProvider(),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof DeadlockAnalysisCard>

export default meta
type Story = StoryObj<typeof meta>

const blockedResult: DeadlockCheckResult = {
  status: DeadlockStatus.BLOCKED,
  reason:
    'Safe A requires Safe B to sign, and Safe B requires Safe A to sign. Neither can execute without the other, creating an unresolvable deadlock.',
  hasDeepNesting: false,
  fetchFailures: [],
}

const warningResult: DeadlockCheckResult = {
  status: DeadlockStatus.WARNING,
  reason: 'This Safe has deeply nested Safe signers. Some signing paths may be difficult or slow to complete.',
  hasDeepNesting: true,
  fetchFailures: [],
}

const unknownResult: DeadlockCheckResult = {
  status: DeadlockStatus.UNKNOWN,
  hasDeepNesting: false,
  fetchFailures: ['0x1234567890abcdef1234567890abcdef12345678'],
}

const validResult: DeadlockCheckResult = {
  status: DeadlockStatus.VALID,
  hasDeepNesting: false,
  fetchFailures: [],
}

export const Blocked: Story = {
  args: { result: blockedResult },
}

export const BlockedExpanded: Story = {
  args: { result: blockedResult },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('This setup creates a signing deadlock'))
    await expect(canvas.getByText(blockedResult.reason!)).toBeVisible()
  },
}

export const Warning: Story = {
  args: { result: warningResult },
}

export const Unknown: Story = {
  args: { result: unknownResult },
}

export const Valid: Story = {
  args: { result: validResult },
  tags: ['!autodocs'],
}

export const Loading: Story = {
  args: { loading: true },
  tags: ['!autodocs'],
}

export const NoResult: Story = {
  args: {},
  tags: ['!autodocs'],
}
