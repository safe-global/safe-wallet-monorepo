import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { accounts } from '../../services/model'
import { createPreviewQueue } from '../../services/queue'
import type { Persona } from '../../types'
import type { GroupBy } from '../shared'
import { AppliedFilters, QueueToolbar } from './QueueFilters'
import { useQueueFilters, type QueueFilterValues } from './useQueueFilters'

function QueueFiltersPreview({
  initial,
  initialGroupBy = 'none',
  persona = 'owner',
}: {
  initial?: Partial<QueueFilterValues>
  initialGroupBy?: GroupBy
  persona?: Persona
}) {
  const items = createPreviewQueue('realistic').items
  const filters = useQueueFilters(items, accounts, persona, initial)
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy)
  return (
    <div className="bg-secondary p-6">
      <QueueToolbar
        filters={filters}
        accounts={accounts}
        hasItems={items.length > 0}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      <AppliedFilters filters={filters} groupBy={groupBy} onGroupByChange={setGroupBy} />
      <p className="text-sm text-muted-foreground">
        {filters.visible.length} of {items.length} transactions match
      </p>
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Filters',
  component: QueueFiltersPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof QueueFiltersPreview>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AppliedFiltersRow: Story = {
  args: { initial: { statuses: ['sign', 'ready'], networks: ['Ethereum'], types: ['Send'] }, initialGroupBy: 'safe' },
}
export const Search: Story = { args: { initial: { search: 'payroll' } } }
export const NonOwner: Story = { args: { persona: 'observer' } }
