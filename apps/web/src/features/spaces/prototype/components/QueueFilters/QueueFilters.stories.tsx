import type { Meta, StoryObj } from '@storybook/react'
import { accounts } from '../../services/model'
import { createPreviewQueue } from '../../services/queue'
import type { Persona } from '../../types'
import { AppliedFilters, QueueToolbar } from './QueueFilters'
import { useQueueFilters, type QueueFilterValues } from './useQueueFilters'

function QueueFiltersPreview({
  initial,
  persona = 'owner',
}: {
  initial?: Partial<QueueFilterValues>
  persona?: Persona
}) {
  const items = createPreviewQueue('realistic').items
  const filters = useQueueFilters(items, accounts, persona, initial)
  return (
    <div className="bg-secondary p-6">
      <QueueToolbar filters={filters} accounts={accounts} hasItems={items.length > 0} />
      <AppliedFilters filters={filters} />
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
  args: { initial: { statuses: ['sign', 'ready'], networks: ['Ethereum'], types: ['Send'] } },
}
export const Search: Story = { args: { initial: { search: 'payroll' } } }
export const NonOwner: Story = { args: { persona: 'member' } }
