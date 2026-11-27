import { useEffect } from 'react'
import { useOverlay } from '@/services/overlay-queue/useOverlay'
import ActiveWorkspaceTour from './ActiveWorkspaceTour'
import { useCanShowWorkspaceTour } from './hooks/useCanShowWorkspaceTour'
import { useWorkspaceTourOpen } from './hooks/useWorkspaceTourOpen'
import { useWorkspaceTourVisit } from './hooks/useWorkspaceTourVisit'

const WorkspaceTour = () => {
  const canShowTour = useCanShowWorkspaceTour()
  const { isOpen, open, close } = useWorkspaceTourOpen()
  const { markSeen } = useWorkspaceTourVisit(canShowTour, open)
  const isShown = useOverlay({ kind: 'guide', isDue: canShowTour && isOpen, onShown: markSeen })

  useEffect(() => {
    if (!canShowTour) close()
  }, [canShowTour, close])

  if (!isShown) return null

  return <ActiveWorkspaceTour onClose={close} />
}

export default WorkspaceTour
