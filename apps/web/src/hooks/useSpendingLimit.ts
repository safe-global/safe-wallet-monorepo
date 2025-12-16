import { useSelector } from 'react-redux'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import useWallet from '@/hooks/wallets/useWallet'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const useSpendingLimit = (selectedToken?: Balance['tokenInfo']): SpendingLimitState | undefined => {
  const wallet = useWallet()
  const spendingLimits = useSelector(selectSpendingLimits)

  return spendingLimits.find(
    (spendingLimit) =>
      sameAddress(spendingLimit.token.address, selectedToken?.address) &&
      sameAddress(spendingLimit.beneficiary, wallet?.address),
  )
}

export default useSpendingLimit
