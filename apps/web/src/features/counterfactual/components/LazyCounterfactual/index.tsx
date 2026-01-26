import usePendingSafeNotifications from '../../hooks/usePendingSafeNotifications'
import usePendingSafeStatus from '../../hooks/usePendingSafeStatuses'

const LazyCounterfactual = () => {
  usePendingSafeStatus()
  usePendingSafeNotifications()

  return null
}

export default LazyCounterfactual
