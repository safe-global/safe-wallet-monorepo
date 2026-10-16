import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { accounts } from '../../services/model'
import { createPreviewQueue, getBulkExecutable } from '../../services/queue'
import type { Scenario } from '../../types'
import type { GroupBy } from '../shared'
import { QueueSection } from './QueueSection'
import { buildSections } from './sections'

function QueueTablePreview({
  scenario = 'everyday',
  groupBy = 'none',
  isWide = true,
}: {
  scenario?: Scenario
  groupBy?: GroupBy
  isWide?: boolean
}) {
  const items = createPreviewQueue(scenario).items
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [replaceHover, setReplaceHover] = useState<string | null>(null)
  const bulkBatches = getBulkExecutable(items)
  const sections = buildSections({
    visible: items,
    accounts,
    accountFilter: [],
    persona: 'owner',
    direction: 'queues',
    groupBy,
  })
  return (
    <div className="flex flex-col gap-10 bg-secondary p-6">
      {sections.map((section) => (
        <QueueSection
          key={section.id}
          section={section}
          items={items}
          persona="owner"
          groupBy={groupBy}
          isWide={isWide}
          collapsed={groupBy !== 'none' && collapsed.includes(section.id)}
          onToggle={() =>
            setCollapsed(
              collapsed.includes(section.id) ? collapsed.filter((id) => id !== section.id) : [...collapsed, section.id],
            )
          }
          safeBatch={bulkBatches.find((batch) => batch.account.id === section.account?.id)}
          onBulkExecute={() => undefined}
          onGroupByChange={() => undefined}
          bulkHover={[]}
          replaceHover={replaceHover}
          onReplaceHover={setReplaceHover}
          onReview={() => undefined}
          onSecondaryAction={() => undefined}
        />
      ))}
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Table',
  component: QueueTablePreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof QueueTablePreview>
export default meta
type Story = StoryObj<typeof meta>

export const Ungrouped: Story = {}
export const RealisticMix: Story = { args: { scenario: 'realistic' } }
export const GroupedBySafe: Story = { args: { groupBy: 'safe' } }
export const GroupedByStatus: Story = { args: { groupBy: 'status' } }
export const CompetingProposals: Story = { args: { scenario: 'conflict-heavy', groupBy: 'safe' } }
export const Narrow: Story = { args: { isWide: false } }
