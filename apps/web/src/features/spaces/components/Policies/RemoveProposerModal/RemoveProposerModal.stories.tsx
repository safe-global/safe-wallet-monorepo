import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { withMockProvider } from '@/storybook/preview'
import RemoveProposerModal from './index'

const meta = {
  title: 'Features/Spaces/Policies/RemoveProposerModal',
  component: RemoveProposerModal,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof RemoveProposerModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Dismissible: Story = {
  render: function DismissibleStory(args) {
    const [open, setOpen] = useState(true)

    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Remove proposer
        </Button>

        <RemoveProposerModal
          {...args}
          open={open}
          onClose={() => {
            args.onClose()
            setOpen(false)
          }}
        />
      </>
    )
  },
}
