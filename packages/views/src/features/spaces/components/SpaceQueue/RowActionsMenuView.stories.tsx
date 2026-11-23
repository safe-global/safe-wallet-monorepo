import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import RowActionsMenuView, { RowDeleteMenuItem } from './RowActionsMenuView'

const meta = {
  title: 'Features/Spaces/Transactions/RowActionsMenu',
  component: RowActionsMenuView,
  parameters: { layout: 'centered' },
  args: {
    nonce: 7,
    canReplace: true,
    canReject: true,
    link: 'https://app.safe.global/transactions/tx',
    onReplace: fn(),
    onReject: fn(),
    onCopyLink: fn(),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions for #7' }))
    await expect(await screen.findByRole('menuitem', { name: 'Reject' })).toBeInTheDocument()
  },
} satisfies Meta<typeof RowActionsMenuView>

export default meta
type Story = StoryObj<typeof meta>

export const CanReject: Story = {
  args: { deleteItem: <RowDeleteMenuItem onDelete={fn()} /> },
}

export const AlreadyRejected: Story = {
  args: {
    canReject: false,
    rejectDisabledReason: 'Transaction with nonce 7 already has a reject transaction',
    deleteItem: <RowDeleteMenuItem disabledReason="Only the person who proposed it can delete it." />,
  },
}
