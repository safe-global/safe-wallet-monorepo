import type { Meta, StoryObj } from '@storybook/react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog'
import { Button } from '../button'

/**
 * Dialog Component Stories
 *
 * Modal dialog built on Base UI, styled with shadcn tokens. Each variant below
 * is opened from its trigger button.
 */
const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">With footer actions</h3>
        <Dialog>
          <DialogTrigger render={<Button>Edit profile</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Make changes to your profile. Save when done.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <DialogClose render={<Button>Save changes</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Title only</h3>
        <Dialog>
          <DialogTrigger render={<Button variant="outline">Open</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Heads up</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">No close button</h3>
        <Dialog>
          <DialogTrigger render={<Button variant="outline">Open</Button>} />
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Dismiss via action</DialogTitle>
              <DialogDescription>This dialog omits the top-right close icon.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button>Got it</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ),
}
