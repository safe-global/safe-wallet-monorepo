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
  const toggle = within(canvasElement).getByTestId('gas-fee-details-toggle')
  await userEvent.click(toggle)
  toggle.blur()
}

export const SignerWallet: Story = {
  name: 'Signer wallet · collapsed',
  args: { scenario: 'signerWallet' },
}

// Keeps the `signer-wallet-open` story id that the shared links point to.
export const SignerWalletOpen: Story = {
  name: 'Signer wallet · editing',
  args: { scenario: 'signerWallet' },
  play: openDetails,
}

export const CannotEstimate: Story = {
  name: 'Signer wallet · cannot estimate',
  args: { scenario: 'cannotEstimate' },
}

export const PaidFromSafe: Story = {
  name: 'Safe account · view only',
  args: { scenario: 'paidFromSafe' },
}

export const PaidFromSafeOpen: Story = {
  name: 'Safe account · view open',
  args: { scenario: 'paidFromSafe' },
  play: openDetails,
}

export const ProPlan: Story = {
  name: 'Pro plan · view only',
  args: { scenario: 'proPlan' },
}
