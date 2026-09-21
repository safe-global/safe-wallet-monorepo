import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import PolicyDrawer from './PolicyDrawer'
import { PolicyStatus } from './variants/types'

const PARENT_SAFE = {
  address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
  name: 'Ops',
  threshold: 3,
}

const meta = {
  title: 'Features/Spaces/Policies/PolicyDrawer',
  component: PolicyDrawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    actionLabel: 'Submit delegation',
    onAction: fn(),
  },
} satisfies Meta<typeof PolicyDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: {
    status: PolicyStatus.ACTIVE,
  },
}

export const Pending: Story = {
  args: {
    status: PolicyStatus.PENDING,
    actionLabel: 'Review transaction',
    description:
      'Marketing is a nested Safe account. The parent Safe account, Ops, needs to execute the transaction before the proposer role activates.',
    safe: PARENT_SAFE,
    signatures: 2,
    expiresLabel: 'Expires in 1h 33 min',
    overview: {
      proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
      appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
      initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
      lastUpdated: '06.24.26 03:35 AM UTC',
      enforcedBy: 'Safe module',
    },
  },
}

export const NotActivated: Story = {
  args: {
    status: PolicyStatus.NOT_ACTIVATED,
  },
}
