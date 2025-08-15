import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'

const usePositionsFiatTotal = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const { currentData: protocols } = usePositionsGetPositionsV1Query({ chainId, safeAddress, fiatCode: currency })

  if (!protocols) return 0

  return protocols.reduce((acc, protocol) => acc + Number(protocol.fiatTotal), 0)
}

export default usePositionsFiatTotal
