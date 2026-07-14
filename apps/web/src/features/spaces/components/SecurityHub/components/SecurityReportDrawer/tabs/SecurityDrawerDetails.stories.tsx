import type { Meta, StoryObj } from '@storybook/react'
import SecurityDrawerDetails from './SecurityDrawerDetails'
import { createMockStory } from '@/stories/mocks'
import { createMockContext } from '@/features/security/testing'

const setup = createMockStory({ features: { spaces: true }, layout: 'paper' })

const meta = {
  title: 'Features/SecurityHub/SecurityDrawerDetails',
  tags: ['autodocs', 'skip-visual-test'],
  component: SecurityDrawerDetails,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
  },
} satisfies Meta<typeof SecurityDrawerDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    scanContext: createMockContext({
      threshold: 4,
      owners: [
        { value: '0x7a2b0000000000000000000000000000000009f0' },
        { value: '0x3c1d00000000000000000000000000000000ab42' },
        { value: '0xb0b00000000000000000000000000000000c0c0c' },
        { value: '0x4444444444444444444444444444444444444444' },
        { value: '0x5555555555555555555555555555555555555555' },
        { value: '0x6666666666666666666666666666666666666666' },
      ],
      version: '1.4.1',
      chainId: '1',
      balanceUsd: 612900,
    }),
    lastScannedAt: Date.now() - 4 * 3_600_000,
  },
}

export const Loading: Story = {
  args: {
    scanContext: null,
    lastScannedAt: null,
  },
}
