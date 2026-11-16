import type { Meta, StoryObj } from '@storybook/react'
import { fn, screen, userEvent, within } from 'storybook/test'
import SafeFilter from './SafeFilter'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/SafeFilter',
  component: SafeFilter,
  parameters: { layout: 'centered' },
  args: {
    options: [
      { safeAddress: '0x1111111111111111111111111111111111111111', name: 'Treasury', count: 11, checked: true },
      { safeAddress: '0x2222222222222222222222222222222222222222', name: '', count: 8, checked: false },
    ],
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Safe' }))
    await screen.findByText('Sorted by number of transactions')
  },
} satisfies Meta<typeof SafeFilter>

export default meta
type Story = StoryObj<typeof meta>

/** A named Safe and an unnamed one, shown by its address. */
export const Default: Story = {}

export const NoSafes: Story = {
  args: { options: [] },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Safe' }))
    await screen.findByText('No Safe accounts')
  },
}
