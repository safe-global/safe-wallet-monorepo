import type { Meta, StoryObj } from '@storybook/react'
import { Steps } from './index'

const meta = {
  title: 'Components/Common/Steps',
  component: Steps,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Steps>

export default meta
type Story = StoryObj<typeof meta>

/** The four-step ladder every TxFlow-composed flow shows, on its first step. */
export const FourSteps: Story = {
  args: {
    items: [
      { id: 'create', label: 'Create', done: true },
      { id: 'review', label: 'Review', done: false },
      { id: 'confirm', label: 'Confirm (0 of 3)', done: false },
      { id: 'execute', label: 'Execute', done: false },
    ],
  },
}

/** The same ladder once the flow has reached the review step. */
export const ReviewReached: Story = {
  args: {
    items: [
      { id: 'create', label: 'Create', done: true },
      { id: 'review', label: 'Review', done: true },
      { id: 'confirm', label: 'Confirm (0 of 3)', done: false },
      { id: 'execute', label: 'Execute', done: false },
    ],
  },
}

/** A transaction that is signed and awaiting execution. */
export const AllDone: Story = {
  args: {
    items: [
      { id: 'create', label: 'Create', done: true },
      { id: 'review', label: 'Review', done: true },
      { id: 'confirm', label: 'Confirm (3 of 3)', done: true },
      { id: 'execute', label: 'Execute', done: true },
    ],
  },
}

/** Flows built on TxLayout have no review step, so they keep the three-step ladder. */
export const ThreeSteps: Story = {
  args: {
    items: [
      { id: 'create', label: 'Create', done: true },
      { id: 'confirm', label: 'Collect signatures', done: false },
      { id: 'execute', label: 'Done', done: false },
    ],
  },
}
