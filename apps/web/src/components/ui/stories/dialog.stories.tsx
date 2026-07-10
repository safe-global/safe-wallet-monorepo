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

export const Open: Story = {
  render: () => (
    <Dialog defaultOpen>
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
  ),
}

export const Sizes: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {(['xs', 'sm', 'default', 'md', 'lg', 'xl'] as const).map((size) => (
        <Dialog key={size}>
          <DialogTrigger render={<Button variant="outline">{size}</Button>} />
          <DialogContent size={size}>
            <DialogHeader>
              <DialogTitle>size=&quot;{size}&quot;</DialogTitle>
              <DialogDescription>Popup max-width follows the {size} token (mirrors MAX_WIDTH_MAP).</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  ),
}

export const Padding: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <Dialog>
        <DialogTrigger render={<Button variant="outline">padding=none</Button>} />
        <DialogContent padding="none">
          <DialogHeader>
            <DialogTitle>padding=&quot;none&quot;</DialogTitle>
            <DialogDescription>Content has no body padding; sections own their own spacing.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger render={<Button variant="outline">padding=md</Button>} />
        <DialogContent padding="md">
          <DialogTitle>padding=&quot;md&quot;</DialogTitle>
          <DialogDescription>Content applies p-6 to the whole popup.</DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  ),
}

export const Surface: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {(['default', 'card', 'paper'] as const).map((surface) => (
        <Dialog key={surface}>
          <DialogTrigger render={<Button variant="outline">{surface}</Button>} />
          <DialogContent surface={surface} padding="md">
            <DialogHeader>
              <DialogTitle>surface=&quot;{surface}&quot;</DialogTitle>
              <DialogDescription>Swaps the popup background token.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  ),
}

export const DividedHeaderFooter: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button>Open</Button>} />
      <DialogContent padding="none" className="max-h-[400px]">
        <DialogHeader divided>
          <DialogTitle>Divided header &amp; footer</DialogTitle>
          <DialogDescription>Header and footer keep their borders while the body scrolls.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-sm">
              Scrollable content row {i + 1}
            </p>
          ))}
        </div>
        <DialogFooter divided>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <DialogClose render={<Button>Confirm</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
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
