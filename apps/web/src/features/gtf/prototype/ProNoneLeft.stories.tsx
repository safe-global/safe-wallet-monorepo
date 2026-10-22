import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { FeePrototype } from './feePrototype'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Prototype/Fee payment/3 · Pro, none left',
  component: FeePrototype,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof FeePrototype>

export default meta
type Story = StoryObj<typeof meta>

export const SignFirstSigner: Story = { name: 'Sign · First signer', args: { screenId: 'pnl-sign-first' } }

export const SignLaterSignerSafeLocked: Story = {
  name: 'Sign · Later signer, Safe account locked',
  args: { screenId: 'pnl-sign-later-safe' },
}

export const SignLaterSignerSignerWallet: Story = {
  name: 'Sign · Later signer, signer wallet picked',
  args: { screenId: 'pnl-sign-later-signer' },
}

export const SignLastSignerSignAndExecute: Story = {
  name: 'Sign · Last signer, sign and execute',
  args: { screenId: 'pnl-sign-last-safe' },
}

export const ExecuteSafeLocked: Story = { name: 'Execute · Safe account locked', args: { screenId: 'pnl-exec-safe' } }

export const ExecuteSignerWalletOnly: Story = {
  name: 'Execute · Signer wallet only',
  args: { screenId: 'pnl-exec-signer' },
}
