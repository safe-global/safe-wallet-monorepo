import { selectUndeployedSafe } from '../../store/undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { CounterfactualStatusButtonView } from '@views/features/counterfactual/components/CounterfactualStatusButton/CounterfactualStatusButtonView'

export { LoopIcon } from '@views/features/counterfactual/components/CounterfactualStatusButton/CounterfactualStatusButtonView'

const CounterfactualStatusButton = () => {
  const { safe, safeAddress } = useSafeInfo()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))

  if (safe.deployed) return null

  const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'

  return <CounterfactualStatusButtonView isActivating={isActivating} />
}

export default CounterfactualStatusButton
