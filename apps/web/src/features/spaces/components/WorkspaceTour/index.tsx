import { useEffect } from 'react'
import ActiveWorkspaceTour from './ActiveWorkspaceTour'
import { useIsDialogOnScreen } from '../../hooks/useDialogOnScreen'
import { useCanShowWorkspaceTour } from './hooks/useCanShowWorkspaceTour'
import { useWorkspaceTourOpen } from './hooks/useWorkspaceTourOpen'
import { useWorkspaceTourVisit } from './hooks/useWorkspaceTourVisit'

const WorkspaceTour = () => {
  const canShowTour = useCanShowWorkspaceTour()
  const { isOpen, open, close } = useWorkspaceTourOpen()
  const isDialogOnScreen = useIsDialogOnScreen()
  const isShown = canShowTour && isOpen && !isDialogOnScreen

  useWorkspaceTourVisit({ canShowTour, isShown, onFirstVisit: open })

  useEffect(() => {
    if (!canShowTour) close()
  }, [canShowTour, close])

  if (!isShown) return null

  return <ActiveWorkspaceTour onClose={close} />
}

export default WorkspaceTour
