import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { QueueGroupByMenu } from './QueueGroupByMenu'

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

export const Network: Story = { args: { value: 'network' } }
