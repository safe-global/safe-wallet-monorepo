import { useRouter } from 'next/router'
import TourDoneDialog from '@safe-global/views/features/spaces/components/WorkspaceTour/TourDoneDialog'
import TourWelcomeDialog from '@safe-global/views/features/spaces/components/WorkspaceTour/TourWelcomeDialog'
import { useCurrentSpaceId } from '@/features/spaces'
import { TOUR_NEXT_ACTIONS, TOUR_STEPS } from './constants'
import { useTourNavigation } from './hooks/useTourNavigation'
import TourStop from './TourStop'

const ActiveWorkspaceTour = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const tour = useTourNavigation(TOUR_STEPS)

  if (tour.isWelcome) return <TourWelcomeDialog onStart={tour.next} onSkip={onClose} />

  if (tour.isDone) {
    const actions = TOUR_NEXT_ACTIONS.map(({ route, ...action }) => ({
      ...action,
      onSelect: () => {
        onClose()
        router.push({ pathname: route, query: { spaceId } })
      },
    }))
    return <TourDoneDialog actions={actions} onBack={tour.back} onFinish={onClose} />
  }

  return (
    <TourStop
      key={tour.step.id}
      step={tour.step}
      progress={tour.progress}
      onBack={tour.back}
      onNext={tour.next}
      onClose={onClose}
      onMissingAnchor={tour.skip}
    />
  )
}

export default ActiveWorkspaceTour
