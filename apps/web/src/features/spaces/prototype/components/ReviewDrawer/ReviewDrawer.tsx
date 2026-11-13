import type { PreviewAction } from '../../services/queue'
import type { MenuAction } from '../../services/actions'
import type { Persona, Proposal } from '../../types'
import type { Hypernative } from '../ScenarioBar'

export { StepsReviewDrawer as ReviewDrawer } from './steps/StepsReviewDrawer'

export type Replacement = { recipient: string; amount: string }

// Layout state lives with the page so stepping with J/K can keep it while opening a new row resets it.
export type ReviewLayout = {
  sections: string[]
  setSections: (sections: string[]) => void
  signersOpen: boolean
  setSignersOpen: (open: boolean) => void
  reject: boolean
  setReject: (reject: boolean) => void
  pendingAction: PreviewAction | null
  setPendingAction: (action: PreviewAction | null) => void
  replacement: Replacement | null
  setReplacement: (replacement: Replacement | null) => void
  // "Expand all" / "Collapse all", kept while stepping. A new `sectionsVersion` re-applies it.
  sectionsMode?: SectionsMode
  sectionsVersion?: number
  toggleAllSections?: () => void
}

export type SectionsMode = 'default' | 'expanded' | 'collapsed'

export type ReviewDrawerProps = {
  review: Proposal | null
  items: Proposal[]
  persona: Persona
  isMobile: boolean
  position: { index: number; count: number }
  layout: ReviewLayout
  feedback: string
  onStep: (offset: number) => void
  onClose: () => void
  onReview: (tx: Proposal) => void
  onAction: (action: PreviewAction) => void
  onProposeAlternative: (kind: 'cancellation' | 'replacement') => void
  remindedIds?: string[]
  onRemind?: (tx: Proposal) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  hypernative?: Hypernative
  // Technical data is collapsed by default. It keeps its state between transactions.
  showTechnical?: boolean
  onToggleTechnical?: () => void
}
