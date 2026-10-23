import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Link } from '@safe-global/views/components/ui/link'
import { AccountIdentity } from '@/features/spaces/components/Policies/components/AccountIdentity'
import GuardStatusBanner from './GuardStatusBanner'

const FOREIGN_GUARD = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'

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
    settingsLink: <Link href="#">Go to Safe settings</Link>,
    renderAddress: (address: string) => <AccountIdentity address={address} showCopyButton />,
    onRetry: fn(),
    guard: { status: 'none' },
  },
} satisfies Meta<typeof GuardStatusBanner>

export default meta
type Story = StoryObj<typeof meta>

/** The animated spinner would make every snapshot differ. */
export const Loading: Story = { args: { guard: { status: 'loading' } }, tags: ['skip-visual-test'] }

export const NoGuard: Story = { args: { guard: { status: 'none' } } }

export const PolicyGuardEnabled: Story = { args: { guard: { status: 'known' } } }

export const UnknownGuard: Story = {
  args: { guard: { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] } },
}

export const UnknownGuardInBothSlots: Story = {
  args: {
    guard: {
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: FOREIGN_GUARD },
        { slot: 'module', address: FOREIGN_GUARD },
      ],
    },
  },
}

export const PartlyEnabled: Story = { args: { guard: { status: 'partial', missingSlot: 'module' } } }

export const Unsupported: Story = { args: { guard: { status: 'unsupported' } } }

export const NotActivated: Story = { args: { guard: { status: 'not-activated' } } }

export const ReadFailed: Story = { args: { guard: { status: 'error' } } }
