import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import TourPlaceholderRow from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import TourSpotlight from '@safe-global/views/features/spaces/components/WorkspaceTour/TourSpotlight'
import TourStepPopover from '@safe-global/views/features/spaces/components/WorkspaceTour/TourStepPopover'
import type { TourProgress } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'
import { useAnchorElement } from './hooks/useAnchorElement'
import { useElementRect } from './hooks/useElementRect'
import { useRouteToStep } from './hooks/useRouteToStep'
import type { TourStep } from './types'
import { toStopHighlight, toVirtualAnchor } from './utils'

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
  const emptyState = useAnchorElement(anchor.element ? step.emptyState : undefined)
  const navItem = useAnchorElement(step.navAnchor)
  const controlToSelect = useAnchorElement(step.selectOnEnter)
  const anchorRect = useElementRect(anchor.element)
  const emptyStateRect = useElementRect(emptyState.element)
  const navRect = useElementRect(navItem.element)

  useRouteToStep(step)

  useEffect(() => {
    if (anchor.isMissing) onMissingAnchor()
  }, [anchor.isMissing, onMissingAnchor])

  useEffect(() => {
    if (controlToSelect.element instanceof HTMLElement) controlToSelect.element.click()
  }, [controlToSelect.element])

  useEffect(() => {
    anchor.element?.scrollIntoView({ block: 'nearest' })
  }, [anchor.element])

  if (!anchorRect) return null

  const { hole, placeholderRow } = toStopHighlight(anchorRect, emptyStateRect)
  const holes = navRect ? [hole, navRect] : [hole]

  return (
    <>
      {createPortal(
        <>
          <TourSpotlight holes={holes} />
          {placeholderRow && <TourPlaceholderRow rect={placeholderRow} />}
        </>,
        portalContainer,
      )}
      <TourStepPopover
        anchor={toVirtualAnchor(hole)}
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
