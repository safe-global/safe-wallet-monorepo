import type { Meta, StoryObj } from '@storybook/react'
import { ChevronsUpDown, Copy, ListChecks, ShieldCheck, UserRoundPen } from 'lucide-react'
import { Drawer } from './Drawer'
import { DrawerBody } from '@safe-global/views/components/common/Drawer/components/DrawerBody'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { DrawerActions } from '@safe-global/views/components/common/Drawer/components/DrawerActions'
import {
  DrawerSignatures,
  DrawerSignaturesBadge,
} from '@safe-global/views/components/common/Drawer/components/DrawerSignatures'
import Identicon from '@safe-global/views/components/common/Identicon'
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

/** The expand button fills the screen; Escape steps back out before it closes. The position shows while full screen. */
export const Expandable: Story = {
  args: {
    ariaLabel: 'Transaction 3 of 12',
    expandable: true,
    children: (
      <>
        <DrawerHeader
          media={iconTile}
          title="Send 1,250 USDC"
          subtitle="Nonce #42 · Ethereum"
          navigation={{ onPrevious: () => {}, onNext: () => {}, hasPrevious: true, hasNext: true, position: '3 of 12' }}
        />
        <DrawerBody>
          <Paragraphs count={12} />
        </DrawerBody>
        <DrawerFooter>
          <Button className="w-full">Sign</Button>
        </DrawerFooter>
      </>
    ),
  },
}

/** Phones always get the full screen, so there is no expand button. */
export const Phone: Story = {
  ...Expandable,
  parameters: { viewport: { defaultViewport: 'mobile' } },
}

const summaryRows = [
  { label: 'Recipient', content: '0x8675...a19b' },
  { label: 'Amount', content: '1,250 USDC' },
  { label: 'Network', content: 'Ethereum' },
]

/** Sections fold from their title. A page can hold their state to expand all, or to keep them as it steps through items. */
export const CollapsibleSections: Story = {
  args: {
    ariaLabel: 'Transaction',
    children: (
      <>
        <DrawerHeader media={iconTile} title="Send 1,250 USDC" subtitle="Nonce #42 · Ethereum" />
        <DrawerBody>
          <div className="flex flex-col gap-6">
            <DrawerSection title="Summary" rightNode="2 of 3 signed" collapsible>
              <DrawerList items={summaryRows} mobileStack />
            </DrawerSection>
            <DrawerSection title="What it does" collapsible>
              <Paragraphs count={2} />
            </DrawerSection>
            <DrawerSection title="Transaction data" collapsible defaultOpen={false}>
              <Paragraphs count={2} />
            </DrawerSection>
          </div>
        </DrawerBody>
      </>
    ),
  },
}

/** A hint above the actions; a secondary and a primary split the row 1:2. */
export const FooterActions: Story = {
  args: {
    ariaLabel: 'Transaction',
    children: (
      <>
        <DrawerHeader media={iconTile} title="Send 1,250 USDC" subtitle="Nonce #42 · Ethereum" />
        <DrawerBody>
          <DrawerList items={summaryRows} />
        </DrawerBody>
        <DrawerFooter hint="Any signer can start this transaction.">
          <DrawerActions
            secondary={<Button variant="secondary">Reject</Button>}
            primary={<Button>Review and sign</Button>}
          />
        </DrawerFooter>
      </>
    ),
  },
}

/** One action fills the row; a disabled one says why in the hint. */
export const FooterSingleAction: Story = {
  args: {
    ariaLabel: 'Allowlist',
    children: (
      <>
        <DrawerHeader media={iconTile} title="Allowlist" subtitle="Treasury · Ethereum" />
        <DrawerBody>
          <DrawerList items={summaryRows} />
        </DrawerBody>
        <DrawerFooter hint="Only signers of this Safe can edit its policies.">
          <DrawerActions primary={<Button disabled>Edit</Button>} />
        </DrawerFooter>
      </>
    ),
  },
}

/** Drag the left edge, or focus it and use the arrow keys. The width resets when the drawer closes. */
export const Resizable: Story = {
  args: {
    ...Expandable.args,
    resizable: true,
  },
}

const signer = (name: string, address: string) => (
  <span className="flex min-w-0 items-center gap-2">
    <Identicon address={address} size={24} />
    <span className="truncate text-sm">{name}</span>
  </span>
)

/** Who has signed, folded above the actions. Open it to see the timeline; Notify is the app's own button. */
export const SignaturesFooter: Story = {
  args: {
    ariaLabel: 'Transaction',
    children: (
      <>
        <DrawerHeader media={iconTile} title="Send 1,250 USDC" subtitle="Nonce #42 · Ethereum" />
        <DrawerBody>
          <DrawerList items={summaryRows} />
        </DrawerBody>
        <DrawerFooter
          summary={
            <DrawerSignatures
              status={<DrawerSignaturesBadge tone="warning">1 of 3 required</DrawerSignaturesBadge>}
              meta="6 days left"
              defaultOpen
              actions={
                <Button variant="ghost-muted" size="icon-sm" aria-label="Copy link">
                  <Copy />
                </Button>
              }
              rows={[
                { id: 'created', status: 'created', signer: 'Ops lead', time: 'Nov 12, 10:02' },
                {
                  id: 'a',
                  status: 'signed',
                  signer: signer('Ops lead', '0x1000000000000000000000000000000000000001'),
                  time: 'Nov 12, 10:04',
                },
                {
                  id: 'b',
                  status: 'needed',
                  signer: signer('Finance', '0x2000000000000000000000000000000000000002'),
                  you: true,
                },
                {
                  id: 'c',
                  status: 'needed',
                  signer: signer('Treasury', '0x3000000000000000000000000000000000000003'),
                  action: (
                    <Button variant="outline" size="xs">
                      Notify
                    </Button>
                  ),
                },
              ]}
            />
          }
        >
          <DrawerActions
            secondary={<Button variant="secondary">Reject</Button>}
            primary={<Button>Review and sign</Button>}
          />
        </DrawerFooter>
      </>
    ),
  },
}

/** The threshold is met without you, so your row asks for nothing and the action is execute. */
export const SignaturesThresholdMet: Story = {
  args: {
    ariaLabel: 'Transaction',
    children: (
      <>
        <DrawerHeader media={iconTile} title="Send 1,250 USDC" subtitle="Nonce #42 · Ethereum" />
        <DrawerBody>
          <DrawerList items={summaryRows} />
        </DrawerBody>
        <DrawerFooter
          summary={
            <DrawerSignatures
              status={<DrawerSignaturesBadge tone="success">2 of 2 signed</DrawerSignaturesBadge>}
              defaultOpen
              rows={[
                { id: 'created', status: 'created', signer: 'Ops lead', time: 'Nov 12, 10:02' },
                {
                  id: 'a',
                  status: 'signed',
                  signer: signer('Ops lead', '0x1000000000000000000000000000000000000001'),
                  time: 'Nov 12, 10:04',
                },
                {
                  id: 'c',
                  status: 'signed',
                  signer: signer('Treasury', '0x3000000000000000000000000000000000000003'),
                  time: 'Nov 12, 11:30',
                },
                {
                  id: 'b',
                  status: 'not-needed',
                  signer: signer('Finance', '0x2000000000000000000000000000000000000002'),
                  you: true,
                },
              ]}
            />
          }
        >
          <DrawerActions primary={<Button>Execute</Button>} />
        </DrawerFooter>
      </>
    ),
  },
}
