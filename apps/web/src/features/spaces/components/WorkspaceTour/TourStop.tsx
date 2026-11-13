import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import TourPlaceholderRow from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import TourSpotlight from '@safe-global/views/features/spaces/components/WorkspaceTour/TourSpotlight'
import TourStepPopover from '@safe-global/views/features/spaces/components/WorkspaceTour/TourStepPopover'
import type { TourProgress } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'
import { SIDEBAR } from './constants'
import { useAnchorElement } from './hooks/useAnchorElement'
import { useElementRect } from './hooks/useElementRect'
import { useRouteToStep } from './hooks/useRouteToStep'
import type { TourStep } from './types'
import { toStopLayout, toVirtualAnchor } from './utils'

type TourStopProps = {
  step: TourStep
  progress: TourProgress
  onBack: () => void
  onNext: () => void
  onClose: () => void
  onMissingAnchor: () => void
}

const TourStop = ({ step, progress, onBack, onNext, onClose, onMissingAnchor }: TourStopProps) => {
  const portalContainer = usePortalContainerElement() ?? document.body
  const anchor = useAnchorElement(step.anchor)
  const sidebarItem = useAnchorElement(step.sidebarItem)
  const sidebar = useAnchorElement(step.sidebarItem ? SIDEBAR : undefined)
  const emptyState = useAnchorElement(anchor.element ? step.emptyState : undefined)
  const controlToSelect = useAnchorElement(step.selectOnEnter)
  const target = step.anchor ? anchor : sidebarItem
  const layout = toStopLayout({
    anchor: useElementRect(anchor.element),
    emptyState: useElementRect(emptyState.element),
    sidebarItem: useElementRect(sidebarItem.element),
    sidebar: useElementRect(sidebar.element),
  })

  useRouteToStep(step)

  useEffect(() => {
    if (target.isMissing) onMissingAnchor()
  }, [target.isMissing, onMissingAnchor])

  useEffect(() => {
    if (controlToSelect.element instanceof HTMLElement) controlToSelect.element.click()
  }, [controlToSelect.element])

  useEffect(() => {
    target.element?.scrollIntoView({ block: 'nearest' })
  }, [target.element])

  if (!target.element || !layout.popoverTarget) return null

  return (
    <>
      {createPortal(
        <>
          {layout.placeholderRow && <TourPlaceholderRow rect={layout.placeholderRow} />}
          <TourSpotlight hole={layout.hole} uncoveredLeft={layout.uncoveredLeft} highlights={layout.highlights} />
        </>,
        portalContainer,
      )}
      <TourStepPopover
        anchor={toVirtualAnchor(layout.popoverTarget)}
        placement={step.placement}
        content={step}
        progress={progress}
        onBack={onBack}
        onNext={onNext}
        onClose={onClose}
      />
    </>
  )
}

export default TourStop
