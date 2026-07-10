import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../sheet'
import { Button } from '../button'

/**
 * Sheet Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52049
 */
const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button>Right</Button>} />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description and content area.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

export const Floating: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button>Open floating</Button>} />
      <SheetContent side="right" variant="floating" surface="card">
        <SheetHeader divided>
          <SheetTitle>Floating sheet</SheetTitle>
          <SheetDescription>
            Detached from the edge with a margin, rounded corners and a card surface (variant=&quot;floating&quot;
            surface=&quot;card&quot;).
          </SheetDescription>
        </SheetHeader>
        <SheetFooter divided>
          <SheetClose render={<Button variant="outline">Close</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const DividedHeaderFooter: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button>Open</Button>} />
      <SheetContent side="right">
        <SheetHeader divided>
          <SheetTitle>Divided header</SheetTitle>
          <SheetDescription>Header and footer keep their borders while the body scrolls.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-sm">
              Scrollable content row {i + 1}
            </p>
          ))}
        </div>
        <SheetFooter divided="subtle">
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
          <SheetClose render={<Button>Confirm</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Positions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, max-content))',
            gap: '1rem',
            justifyItems: 'start',
          }}
        >
          <Sheet>
            <SheetTrigger render={<Button>Right</Button>} />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Right Sheet</SheetTitle>
                <SheetDescription>Sheet slides in from the right.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger render={<Button>Left</Button>} />
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Left Sheet</SheetTitle>
                <SheetDescription>Sheet slides in from the left.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger render={<Button>Top</Button>} />
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>Top Sheet</SheetTitle>
                <SheetDescription>Sheet slides in from the top.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger render={<Button>Bottom</Button>} />
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Bottom Sheet</SheetTitle>
                <SheetDescription>Sheet slides in from the bottom.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Content</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <Sheet>
            <SheetTrigger render={<Button>Open Sheet</Button>} />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>Sheet description goes here.</SheetDescription>
              </SheetHeader>
              <div style={{ padding: '1rem 0' }}>
                <p className="text-sm">Sheet content area.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  ),
}
