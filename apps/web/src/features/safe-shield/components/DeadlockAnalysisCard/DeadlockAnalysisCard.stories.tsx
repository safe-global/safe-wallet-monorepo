import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Box } from '@mui/material'
import { DeadlockStatus } from '@safe-global/utils/features/safe-shield/types'
import type { DeadlockCheckResult } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
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

const toAsync = (result: DeadlockCheckResult, loading = false): AsyncResult<DeadlockCheckResult> => [
  result,
  undefined,
  loading,
]

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
  args: { deadlock: toAsync(blockedResult) },
}

export const BlockedExpanded: Story = {
  args: { deadlock: toAsync(blockedResult) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Signing deadlock risk detected'))
    await expect(canvas.getByText(blockedResult.reason!)).toBeVisible()
  },
}

export const Warning: Story = {
  args: { deadlock: toAsync(warningResult) },
}

export const Unknown: Story = {
  args: { deadlock: toAsync(unknownResult) },
}

export const Valid: Story = {
  args: { deadlock: toAsync(validResult) },
  tags: ['!autodocs'],
}

export const Loading: Story = {
  args: { deadlock: [undefined, undefined, true] },
  tags: ['!autodocs'],
}

export const NoResult: Story = {
  args: {},
  tags: ['!autodocs'],
}
