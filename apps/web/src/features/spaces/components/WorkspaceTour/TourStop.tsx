import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import TourPlaceholderRow from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import TourSpotlight from '@safe-global/views/features/spaces/components/WorkspaceTour/TourSpotlight'
import TourStepPopover from '@safe-global/views/features/spaces/components/WorkspaceTour/TourStepPopover'
import type { TourProgress } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'
import { useSelectTabOnEnter } from './hooks/useSelectTabOnEnter'
import { useStepRoute } from './hooks/useStepRoute'
import { useStopLayout } from './hooks/useStopLayout'
import type { TourStep } from './types'
import { scrollBelowHeaders, toVirtualAnchor } from './utils'

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
  const isOnStepRoute = useStepRoute(step, onClose)
  const { target, tabToClick, layout } = useStopLayout(step, isOnStepRoute, onMissingAnchor)

  useSelectTabOnEnter(tabToClick)

  const side = step.placement.side

  useEffect(() => {
    if (!target) return
    if (side === 'bottom') scrollBelowHeaders(target)
    else target.scrollIntoView({ block: 'nearest' })
  }, [target, side])

  if (!target || !layout.popoverTarget) return null

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
