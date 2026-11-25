import { useEffect } from 'react'
import ActiveWorkspaceTour from './ActiveWorkspaceTour'
import { useCurrentSpaceId } from '../../public/hooks/useCurrentSpaceId'
import { useIsTrialReminderPending } from '../../hooks/useTrialReminder'
import { useCanShowWorkspaceTour } from './hooks/useCanShowWorkspaceTour'
import { useWorkspaceTourOpen } from './hooks/useWorkspaceTourOpen'
import { useWorkspaceTourVisit } from './hooks/useWorkspaceTourVisit'

const WorkspaceTour = () => {
  const canShowTour = useCanShowWorkspaceTour()
  const { isOpen, open, close } = useWorkspaceTourOpen()

  const isTrialReminderPending = useIsTrialReminderPending(useCurrentSpaceId())

  useWorkspaceTourVisit(canShowTour && !isTrialReminderPending, open)

  useEffect(() => {
    if (!canShowTour) close()
  }, [canShowTour, close])

  if (!canShowTour || !isOpen) return null

  return <ActiveWorkspaceTour onClose={close} />
}

export default WorkspaceTour
