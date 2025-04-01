import { useSelector } from 'react-redux'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useWallet from '@/hooks/wallets/useWallet'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const useSpendingLimit = (selectedToken?: TokenInfo): SpendingLimitState | undefined => {
  const wallet = useWallet()
  const spendingLimits = useSelector(selectSpendingLimits)

  return spendingLimits.find(
    (spendingLimit) =>
      sameAddress(spendingLimit.token.address, selectedToken?.address) &&
      sameAddress(spendingLimit.beneficiary, wallet?.address),
  )
}

export default useSpendingLimit
