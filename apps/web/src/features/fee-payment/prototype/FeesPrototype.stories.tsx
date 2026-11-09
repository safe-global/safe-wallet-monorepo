import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { withMockProvider } from '@/storybook/decorators'
import { FeesPrototype } from './FeesPrototype'

const meta = {
  title: 'Design System/Prototypes/Fees with gas details',
  component: FeesPrototype,
  parameters: { layout: 'centered' },
  decorators: [
    withMockProvider(),
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeesPrototype>

export default meta
type Story = StoryObj<typeof meta>

const openDetails: Story['play'] = async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByTestId('gas-fee-details-toggle'))
}

export const SignerWallet: Story = {
  name: 'Signer wallet · collapsed',
  args: { scenario: 'signerWallet' },
}

export const SignerWalletOpen: Story = {
  name: 'Signer wallet · details open',
  args: { scenario: 'signerWallet' },
  play: openDetails,
}

export const SignerWalletEditing: Story = {
  name: 'Signer wallet · editing',
  args: { scenario: 'editing' },
  play: openDetails,
}

export const CannotEstimate: Story = {
  name: 'Signer wallet · cannot estimate',
  args: { scenario: 'cannotEstimate' },
}

export const PaidFromSafe: Story = {
  name: 'Safe account · read-only',
  args: { scenario: 'paidFromSafe' },
  play: openDetails,
}

export const ProPlan: Story = {
  name: 'Pro plan · read-only',
  args: { scenario: 'proPlan' },
  play: openDetails,
}
