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

const openEditor: Story['play'] = async ({ canvasElement }) => {
  const toggle = within(canvasElement).getByTestId('gas-fee-edit-toggle')
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
  play: openEditor,
}

export const CannotEstimate: Story = {
  name: 'Signer wallet · cannot estimate',
  args: { scenario: 'cannotEstimate' },
}

export const PaidFromSafe: Story = {
  name: 'Safe account · static row',
  args: { scenario: 'paidFromSafe' },
}

export const ProPlan: Story = {
  name: 'Pro plan · static row',
  args: { scenario: 'proPlan' },
}
