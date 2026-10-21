import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { accounts } from '../../services/model'
import { createPreviewQueue, getBulkExecutable } from '../../services/queue'
import type { Scenario } from '../../types'
import type { GroupBy } from '../shared'
import { QueueSection } from './QueueSection'
import { QueueGroupedTable } from './QueueGroupedTable'
import { buildSections, type QueueSectionData } from './sections'

function QueueTablePreview({
  scenario = 'everyday',
  groupBy = 'none',
  isWide = true,
  steps = false,
  oneTable = false,
}: {
  scenario?: Scenario
  groupBy?: GroupBy
  isWide?: boolean
  steps?: boolean
  // Option D: every section in one table.
  oneTable?: boolean
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
    direction: steps ? 'steps' : 'queues',
    groupBy,
  })
  const isCollapsed = (id: string) => groupBy !== 'none' && collapsed.includes(id)
  const toggle = (id: string) =>
    setCollapsed(collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id])
  const getSafeBatch = (section: QueueSectionData) =>
    bulkBatches.find((batch) => batch.account.id === section.account?.id)
  const shared = {
    items,
    persona: 'owner' as const,
    groupBy,
    steps,
    isWide,
    onBulkExecute: () => undefined,
    onGroupByChange: () => undefined,
    bulkHover: [],
    replaceHover,
    onReplaceHover: setReplaceHover,
    onReview: () => undefined,
    onSecondaryAction: () => undefined,
  }
  return (
    <div className={`flex flex-col bg-secondary p-6 ${steps ? 'gap-6' : 'gap-10'}`}>
      {oneTable ? (
        <QueueGroupedTable
          sections={sections}
          isCollapsed={isCollapsed}
          onToggle={toggle}
          getSafeBatch={getSafeBatch}
          collapse={{
            allCollapsed: sections.every((section) => collapsed.includes(section.id)),
            onToggle: () =>
              setCollapsed(
                sections.every((section) => collapsed.includes(section.id))
                  ? []
                  : sections.map((section) => section.id),
              ),
          }}
          {...shared}
        />
      ) : (
        sections.map((section) => (
          <QueueSection
            key={section.id}
            section={section}
            collapsed={isCollapsed(section.id)}
            onToggle={() => toggle(section.id)}
            safeBatch={getSafeBatch(section)}
            {...shared}
          />
        ))
      )}
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
export const NextStepsBySafe: Story = { args: { steps: true, groupBy: 'safe' } }
export const OneTableBySafe: Story = { args: { steps: true, oneTable: true, groupBy: 'safe' } }
