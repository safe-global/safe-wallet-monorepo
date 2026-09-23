import type { Meta, StoryObj } from '@storybook/react'
import { ShieldCheck, UserRoundPen } from 'lucide-react'
import { Drawer } from './Drawer'
import {
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerList,
  DrawerSection,
  DrawerSubtitle,
  DrawerTitle,
} from './components'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Badge, BadgeDot } from '@/components/ui/badge'

const meta = {
  title: 'Components/Common/Drawer',
  component: Drawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: () => {},
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

const Paragraphs = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <Typography key={i} variant="paragraph-small" className="mb-4">
        Paragraph {i + 1} — the drawer body scrolls once the content outgrows the panel.
      </Typography>
    ))}
  </>
)

export const Full: Story = {
  args: {
    ariaLabel: 'Full drawer',
    children: (
      <>
        <DrawerHeader>
          <div className="size-7 rounded-full bg-primary" />
          <div className="min-w-0">
            <DrawerTitle>Operations Vault</DrawerTitle>
            <DrawerSubtitle>Last updated 2 minutes ago</DrawerSubtitle>
          </div>
        </DrawerHeader>
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
        <DrawerFooter>
          <Button className="w-full">Submit delegation</Button>
        </DrawerFooter>
      </>
    ),
  },
}

/** The Policies header: a badge-style icon, a large title and a status chip pushed to the right. */
export const StatusHeader: Story = {
  args: {
    ariaLabel: 'Proposer role',
    children: (
      <>
        <DrawerHeader>
          <div className="bg-success-subtle flex size-10 items-center justify-center rounded-lg">
            <UserRoundPen className="text-success-strong size-4" />
          </div>
          <DrawerTitle size="lg">Proposer role</DrawerTitle>
          <Badge variant="warning" size="status" shape="status" className="ml-auto">
            <BadgeDot />
            Pending
          </Badge>
        </DrawerHeader>
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
        <DrawerFooter>
          <Button className="w-full">Submit delegation</Button>
        </DrawerFooter>
      </>
    ),
  },
}

/** Sections label the blocks inside a body; the trailing note is optional. */
export const Sections: Story = {
  args: {
    ariaLabel: 'Sectioned drawer',
    children: (
      <>
        <DrawerHeader>
          <DrawerTitle size="lg">Proposer role</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-4">
            <DrawerSection title="Pending signatures" rightNode="Expires in 1h 33 min">
              <div className="rounded-lg bg-muted p-3">
                <Typography variant="paragraph-small">Section content</Typography>
              </div>
            </DrawerSection>
            <DrawerSection title="Details">
              <Typography variant="paragraph-small">A section with no trailing note.</Typography>
            </DrawerSection>
          </div>
        </DrawerBody>
      </>
    ),
  },
}

/** Label/value rows for the facts a policy or transaction carries. */
export const List: Story = {
  args: {
    ariaLabel: 'List drawer',
    children: (
      <>
        <DrawerHeader>
          <DrawerTitle size="lg">Proposer role</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <DrawerList
            items={[
              { label: 'Proposer', content: 'Marc' },
              { label: 'Applies to', content: 'Marketing' },
              { label: 'Last updated', content: '06.24.26 03:35 AM UTC' },
              {
                label: 'Enforced by',
                content: (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    <span className="underline">Safe module</span>
                  </span>
                ),
              },
            ]}
          />
        </DrawerBody>
      </>
    ),
  },
}

export const OnlyTitle: Story = {
  args: {
    ariaLabel: 'Title only drawer',
    children: (
      <>
        <DrawerHeader>
          <DrawerTitle>Batched transactions</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}

export const NoHeader: Story = {
  args: {
    ariaLabel: 'Headerless drawer',
    children: (
      <DrawerBody>
        <Paragraphs count={3} />
      </DrawerBody>
    ),
  },
}

export const LongContent: Story = {
  args: {
    ariaLabel: 'Scrolling drawer',
    children: (
      <>
        <DrawerHeader>
          <DrawerTitle>Scrolling body</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Paragraphs count={30} />
        </DrawerBody>
        <DrawerFooter>
          <Button className="w-full">Submit delegation</Button>
        </DrawerFooter>
      </>
    ),
  },
}

export const SizeLg: Story = {
  args: {
    ariaLabel: 'Wide drawer',
    size: 'lg',
    children: (
      <>
        <DrawerHeader>
          <DrawerTitle>Wide drawer</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}
