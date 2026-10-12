import type { Meta, StoryObj } from '@storybook/react'
import TransactionDetailsError from './TransactionDetailsError'

const meta = {
  title: 'Components/Transactions/TransactionDetailsError',
  tags: ['autodocs'],
  component: TransactionDetailsError,
} satisfies Meta<typeof TransactionDetailsError>

export default meta
type Story = StoryObj<typeof meta>

/** The transaction details request failed — reloading may recover it. */
export const LoadFailure: Story = {
  args: {
    onReload: () => {},
  },
}

/** The transaction belongs to another Safe, so no reload is offered. */
export const WrongSafe: Story = {
  args: {
    message: 'This transaction was not found in this Safe account.',
  },
}
