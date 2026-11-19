import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { screen, userEvent, within } from 'storybook/test'
import QueueGroupByMenu from './QueueGroupByMenu'

const meta = {
  title: 'Features/Spaces/Transactions/QueueGroupByMenu',
  component: QueueGroupByMenu,
  parameters: { layout: 'padded' },
  args: { value: 'status', onChange: () => {} },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <QueueGroupByMenu value={value} onChange={setValue} />
  },
} satisfies Meta<typeof QueueGroupByMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Status: Story = {}

/** The menu open on the Network grouping */
export const Network: Story = {
  args: { value: 'network' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Group by Network' }))
    await screen.findAllByRole('menuitemradio')
  },
}
