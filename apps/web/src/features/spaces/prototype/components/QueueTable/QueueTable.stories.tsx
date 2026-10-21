import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { accounts } from '../../services/model'
import { createPreviewQueue, getBulkExecutable } from '../../services/queue'
import type { Scenario } from '../../types'
import { QueueGroupedTable } from './QueueGroupedTable'
import { buildSections, type QueueSectionData } from './sections'

function QueueTablePreview({ scenario = 'everyday', isWide = true }: { scenario?: Scenario; isWide?: boolean }) {
  const items = createPreviewQueue(scenario).items
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [replaceHover, setReplaceHover] = useState<string | null>(null)
  const bulkBatches = getBulkExecutable(items)
  const sections = buildSections({ visible: items, accounts, accountFilter: [], persona: 'owner' })
  const allCollapsed = sections.every((section) => collapsed.includes(section.id))
  return (
    <div className="flex flex-col gap-6 bg-secondary p-6">
      <QueueGroupedTable
        sections={sections}
        isCollapsed={(id) => collapsed.includes(id)}
        onToggle={(id) =>
          setCollapsed(collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id])
        }
        getSafeBatch={(section: QueueSectionData) =>
          bulkBatches.find((batch) => batch.account.id === section.account.id)
        }
        collapse={{
          allCollapsed,
          onToggle: () => setCollapsed(allCollapsed ? [] : sections.map((section) => section.id)),
        }}
        items={items}
        persona="owner"
        isWide={isWide}
        onBulkExecute={() => undefined}
        bulkHover={[]}
        replaceHover={replaceHover}
        onReplaceHover={setReplaceHover}
        onReview={() => undefined}
      />
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

export const BySafe: Story = {}
export const RealisticMix: Story = { args: { scenario: 'realistic' } }
export const CompetingProposals: Story = { args: { scenario: 'conflict-heavy' } }
export const Narrow: Story = { args: { isWide: false } }
