import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@safe-global/views/components/ui/button'
import { SafeIdentity } from '@/features/spaces/components/Policies/components/SafeIdentity'
import GuardStatusBanner from './GuardStatusBanner'

const FOREIGN_GUARD = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
const FOREIGN_MODULE_GUARD = '0x8f3b5C4e2D1a9B7c6E0f4A3d2B1c9E8f7A6b31b0'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/GuardStatusBanner',
  component: GuardStatusBanner,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-xl bg-card p-6">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    safeName: 'Treasury',
    onRetry: fn(),
    settingsLink: <Button variant="outline">Go to Safe settings</Button>,
    renderAddress: (address, name) => <SafeIdentity address={address} name={name} />,
    guard: { status: 'loading' },
  },
} satisfies Meta<typeof GuardStatusBanner>

export default meta
type Story = StoryObj<typeof meta>

/** The animated spinner would make every snapshot differ. */
export const Loading: Story = { args: { guard: { status: 'loading' } }, tags: ['skip-visual-test'] }

export const UnknownGuard: Story = {
  args: { guard: { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] } },
}

export const UnknownGuardInBothSlots: Story = {
  args: {
    guard: {
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: FOREIGN_GUARD },
        { slot: 'module', address: FOREIGN_MODULE_GUARD },
      ],
    },
  },
}

export const PartlyEnabled: Story = { args: { guard: { status: 'partial', missingSlot: 'module' } } }
export const PartlyEnabledWithoutTransactionGuard: Story = {
  args: { guard: { status: 'partial', missingSlot: 'transaction' } },
}

export const Unsupported: Story = { args: { guard: { status: 'unsupported' } } }

export const NotActivated: Story = { args: { guard: { status: 'not-activated' } } }

export const ReadFailed: Story = { args: { guard: { status: 'error' } } }
