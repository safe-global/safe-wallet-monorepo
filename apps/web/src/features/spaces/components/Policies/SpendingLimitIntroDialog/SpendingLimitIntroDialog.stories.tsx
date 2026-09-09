import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { withMockProvider } from '@/storybook/preview'
import SpendingLimitIntroDialog from './index'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitIntroDialog',
  component: SpendingLimitIntroDialog,
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
} satisfies Meta<typeof SpendingLimitIntroDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The intro as designed: the end-result preview, the three things to know, and the way in. */
export const Default: Story = {}

/**
 * Open state held by the story, so dismissal is exercisable: the close button, Escape and a click
 * outside all close the dialog and leave `onProceed` uncalled — the "nothing started" guarantee.
 * Proceeding closes it too, as it does on the Policies page.
 */
export const Dismissible: Story = {
  render: function DismissibleStory(args) {
    const [open, setOpen] = useState(true)

    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open the intro
        </Button>

        <SpendingLimitIntroDialog
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
