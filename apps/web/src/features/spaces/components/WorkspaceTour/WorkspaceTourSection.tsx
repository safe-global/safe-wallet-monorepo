import WorkspaceTourSettingsSection from '@safe-global/views/features/spaces/components/WorkspaceTour/WorkspaceTourSettingsSection'
import { useCanShowWorkspaceTour } from './hooks/useCanShowWorkspaceTour'
import { useWorkspaceTourOpen } from './hooks/useWorkspaceTourOpen'

const WorkspaceTourSection = () => {
  const canShowTour = useCanShowWorkspaceTour()
  const { open } = useWorkspaceTourOpen()

  if (!canShowTour) return null

  return <WorkspaceTourSettingsSection onStart={open} />
}

export default WorkspaceTourSection
