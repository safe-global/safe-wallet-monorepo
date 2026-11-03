import usePositions from './usePositions'
import { calculatePositionsFiatTotal } from '@safe-global/utils/features/positions/utils/calculatePositionsFiatTotal'

const usePositionsFiatTotal = () => {
  const { data: protocols } = usePositions()

  return calculatePositionsFiatTotal(protocols)
}

export default usePositionsFiatTotal
