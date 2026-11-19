import type { Meta, StoryObj } from '@storybook/react'
import { ChevronsUpDown, Copy, ListChecks, ShieldCheck, UserRoundPen } from 'lucide-react'
import { Drawer } from './Drawer'
import { DrawerBody } from '@safe-global/views/components/common/Drawer/components/DrawerBody'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { DrawerList } from '@safe-global/views/components/common/Drawer/components/DrawerList'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'

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
        <DrawerHeader
          media={<div className="size-9 rounded-full bg-primary" />}
          title="Operations Vault"
          subtitle="Last updated 2 minutes ago"
        />
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

/** The Policies header: an icon tile, a title and the status on the second line. */
export const StatusHeader: Story = {
  args: {
    ariaLabel: 'Proposer role',
    children: (
      <>
        <DrawerHeader
          media={
            <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
              <UserRoundPen className="size-4 text-success-strong" />
            </div>
          }
          title="Proposer role"
          status={
            <Badge variant="warning" size="status" shape="status">
              <BadgeDot />
              Pending
            </Badge>
          }
        />
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
        <DrawerHeader title="Proposer role" />
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
        <DrawerHeader title="Proposer role" />
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
        <DrawerHeader title="Batched transactions" />
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
        <DrawerHeader title="Scrolling body" />
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
        <DrawerHeader title="Wide drawer" />
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}

const iconTile = (
  <div className="flex size-9 items-center justify-center rounded-md border border-border bg-card">
    <ListChecks className="size-4" />
  </div>
)

/** Previous and next step through the list the drawer was opened from; the ends are disabled. */
export const Navigation: Story = {
  args: {
    ariaLabel: 'Transaction 3 of 12',
    children: (
      <>
        <DrawerHeader
          media={iconTile}
          title="Send 1,250 USDC"
          subtitle="Nonce #42 · Ethereum"
          navigation={{
            onPrevious: () => {},
            onNext: () => {},
            hasPrevious: true,
            hasNext: false,
            position: '12 of 12',
          }}
        />
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}

/** Back returns to the drawer this one was opened from. Extra actions sit in the same group, before close. */
export const BackAndActions: Story = {
  args: {
    ariaLabel: 'Spending limit',
    children: (
      <>
        <DrawerHeader
          media={iconTile}
          title="Spending limit"
          subtitle="Treasury · Ethereum"
          onBack={() => {}}
          actions={[
            { label: 'Copy link', icon: <Copy />, onClick: () => {} },
            { label: 'Expand all sections', icon: <ChevronsUpDown />, onClick: () => {}, shortcut: 'E' },
          ]}
        />
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}

/** A title that doesn't fit fades out at the end instead of wrapping or pushing the buttons. */
export const LongTitle: Story = {
  args: {
    ariaLabel: 'Long title',
    children: (
      <>
        <DrawerHeader
          media={iconTile}
          title="Quarterly operations and treasury rebalancing account"
          status={
            <Badge variant="success" size="status" shape="status">
              <BadgeDot />
              Active
            </Badge>
          }
          navigation={{ onPrevious: () => {}, onNext: () => {}, hasPrevious: true, hasNext: true }}
        />
        <DrawerBody>
          <Paragraphs count={3} />
        </DrawerBody>
      </>
    ),
  },
}
