import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { getConflicts, getState, getWarnings } from '../../services/model'
import { createPreviewQueue, type PreviewAction } from '../../services/queue'
import type { Persona, Proposal, Scenario } from '../../types'
import { ReviewDrawer, type Replacement } from './ReviewDrawer'

type Selector = (tx: Proposal, items: Proposal[], persona: Persona) => boolean

function ReviewDrawerPreview({
  scenario = 'everyday',
  persona = 'owner',
  pick,
  sections = [],
  steps = false,
}: {
  scenario?: Scenario
  persona?: Persona
  pick: Selector
  sections?: string[]
  steps?: boolean
}) {
  const items = createPreviewQueue(scenario).items
  const order = items.filter((tx) => pick(tx, items, persona))
  const [index, setIndex] = useState(0)
  const [openSections, setSections] = useState(sections)
  const [signersOpen, setSignersOpen] = useState(true)
  const [reject, setReject] = useState(false)
  const [pendingAction, setPendingAction] = useState<PreviewAction | null>(null)
  const [replacement, setReplacement] = useState<Replacement | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)
  return (
    <ReviewDrawer
      review={order[index] ?? null}
      items={items}
      persona={persona}
      isMobile={false}
      position={{ index, count: order.length }}
      layout={{
        sections: openSections,
        setSections,
        signersOpen,
        setSignersOpen,
        reject,
        setReject,
        pendingAction,
        setPendingAction,
        replacement,
        setReplacement,
      }}
      feedback=""
      onStep={(offset) => setIndex(Math.min(Math.max(index + offset, 0), order.length - 1))}
      onClose={() => undefined}
      onReview={() => undefined}
      onAction={() => setPendingAction(null)}
      onProposeAlternative={() => undefined}
      steps={steps}
      showTechnical={showTechnical}
      onToggleTechnical={() => setShowTechnical(!showTechnical)}
    />
  )
}

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Review drawer',
  component: ReviewDrawerPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReviewDrawerPreview>
export default meta
type Story = StoryObj<typeof meta>

export const ReadyToSign: Story = {
  args: { pick: (tx, _items, persona) => getState(tx, persona).canSign, sections: ['summary'] },
}
export const ReadyToExecute: Story = {
  args: { pick: (tx, _items, persona) => getState(tx, persona).ready, sections: ['summary'] },
}
export const Blocked: Story = {
  args: { pick: (tx, _items, persona) => getState(tx, persona).waiting, sections: ['summary', 'dependencies'] },
}
export const CompetingProposals: Story = {
  args: {
    scenario: 'conflict-heavy',
    pick: (tx, items) => getConflicts(tx, items).length > 0,
    sections: ['conflicts'],
  },
}
export const Warnings: Story = {
  args: { scenario: 'realistic', pick: (tx) => getWarnings(tx).length > 0, sections: ['details'] },
}
export const NonOwner: Story = { args: { persona: 'observer', pick: () => true, sections: ['summary'] } }

// Next steps (option C): the drawer shows the queue row in full.
export const NextStepsReadyToSign: Story = {
  args: { steps: true, pick: (tx, _items, persona) => getState(tx, persona).canSign },
}
export const NextStepsReadyToExecute: Story = {
  args: { steps: true, pick: (tx, _items, persona) => getState(tx, persona).ready },
}
export const NextStepsBlocked: Story = {
  args: { steps: true, pick: (tx, _items, persona) => getState(tx, persona).waiting && !getState(tx, persona).canSign },
}
export const NextStepsWaitingOnOthers: Story = {
  args: {
    steps: true,
    pick: (tx, _items, persona) =>
      !getState(tx, persona).canSign && !getState(tx, persona).waiting && !getState(tx, persona).ready,
  },
}
export const NextStepsCompeting: Story = {
  args: { steps: true, scenario: 'conflict-heavy', pick: (tx, items) => getConflicts(tx, items).length > 0 },
}
export const NextStepsWithWarnings: Story = {
  args: { steps: true, scenario: 'realistic', pick: (tx) => getWarnings(tx).length > 0 },
}
export const NextStepsEveryType: Story = {
  args: { steps: true, scenario: 'realistic', pick: () => true },
}
