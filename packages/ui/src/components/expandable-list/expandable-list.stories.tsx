import type { Meta, StoryObj } from '@storybook/react'
import { ArrowRight, CircleAlert, CircleCheck, CircleMinus, TriangleAlert } from 'lucide-react'
import { Badge } from '../../primitives/badge/badge'
import { Button } from '../../primitives/button/button'
import { ExpandableList, ExpandableListGroup, ExpandableListItem } from './expandable-list'

/**
 * Separate card rows that open into an inset body. Group them under a header, mark each with a tone bar and a
 * leading icon, and put the details, evidence or a call to action in the body.
 */
const meta = {
  title: 'Safe UI/ExpandableList',
  component: ExpandableList,
  decorators: [
    (Story) => (
      <div className="bg-surface-sunken p-6">
        <div className="max-w-[560px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ExpandableList>

export default meta
type Story = StoryObj<typeof meta>

/** Checks grouped by status: failing rows first, each with a tone bar, an icon and a call to action. */
export const SecurityChecks: Story = {
  render: () => (
    <ExpandableList>
      <ExpandableListGroup header={<Badge variant="destructive">At risk · 1</Badge>}>
        <ExpandableListItem
          value="threshold"
          tone="critical"
          leading={<CircleAlert className="size-[18px] text-tone-critical" />}
          title="One signer can approve transactions"
          description="Raise the threshold so no single key can move funds."
        >
          <Button variant="outline" size="sm" className="self-start">
            Change threshold
            <ArrowRight />
          </Button>
        </ExpandableListItem>
      </ExpandableListGroup>
      <ExpandableListGroup header={<Badge variant="warning">Needs attention · 2</Badge>}>
        <ExpandableListItem
          value="recovery"
          tone="attention"
          leading={<TriangleAlert className="size-[18px] text-tone-attention" />}
          title="No recovery set up"
          description="Add a recovery method so the Treasury stays reachable if signers lose their keys."
        />
        <ExpandableListItem
          value="version"
          tone="warning"
          leading={<TriangleAlert className="size-[18px] text-tone-warning" />}
          title="Account version is out of date"
        >
          Version 1.3.0 · latest 1.4.1
        </ExpandableListItem>
      </ExpandableListGroup>
      <ExpandableListGroup header={<Badge variant="success">Passing · 2</Badge>}>
        <ExpandableListItem
          value="signers"
          tone="success"
          leading={<CircleCheck className="size-[18px] text-tone-success" />}
          title="Signers are distinct"
        >
          3 signers, no duplicates.
        </ExpandableListItem>
        <ExpandableListItem
          value="modules"
          tone="neutral"
          leading={<CircleMinus className="size-[18px] text-tone-neutral" />}
          title="No modules enabled"
        />
      </ExpandableListGroup>
    </ExpandableList>
  ),
}

/** Without groups, tones or icons: a plain stack of rows. */
export const PlainList: Story = {
  render: () => (
    <ExpandableList>
      <ExpandableListItem value="what" title="What is a signer?">
        A signer is an address that can approve transactions for the account.
      </ExpandableListItem>
      <ExpandableListItem value="threshold" title="What is the threshold?">
        The number of signers that must approve before a transaction can run.
      </ExpandableListItem>
      <ExpandableListItem value="fees" title="Who pays the network fee?">
        The signer who executes the transaction, unless a relayer covers it.
      </ExpandableListItem>
    </ExpandableList>
  ),
}

/** A `trailing` node sits before the chevron; a row without a body stays static. */
export const WithTrailingActions: Story = {
  render: () => (
    <ExpandableList>
      <ExpandableListItem
        value="modules"
        tone="warning"
        title="2 modules enabled"
        trailing={
          <Button variant="secondary" size="xs" onClick={(event) => event.stopPropagation()}>
            View 2
          </Button>
        }
      >
        Allowance module, Recovery module
      </ExpandableListItem>
      <ExpandableListItem
        value="guard"
        tone="success"
        title="Guard enabled"
        trailing={<span className="text-xs text-muted-foreground">Since 2026-01-05</span>}
      />
    </ExpandableList>
  ),
}
