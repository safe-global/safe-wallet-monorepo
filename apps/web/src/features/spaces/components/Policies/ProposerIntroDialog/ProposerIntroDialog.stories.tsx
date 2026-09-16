import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { withMockProvider } from '@/storybook/preview'
import ProposerIntroDialog from './index'

const meta = {
  title: 'Features/Spaces/Policies/ProposerIntroDialog',
  component: ProposerIntroDialog,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onProceed: fn(),
  },
} satisfies Meta<typeof ProposerIntroDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Dismissible: Story = {
  render: function DismissibleStory(args) {
    const [open, setOpen] = useState(true)

    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open the intro
        </Button>

        <ProposerIntroDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          onProceed={() => {
            args.onProceed()
            setOpen(false)
          }}
        />
      </>
    )
  },
}
