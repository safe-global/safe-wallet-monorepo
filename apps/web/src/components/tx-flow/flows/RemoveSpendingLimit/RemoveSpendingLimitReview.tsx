import {
  getSpendingLimitInterface,
  getDeployedSpendingLimitModuleAddress,
} from '@/services/contracts/spendingLimitContracts'
import useChainId from '@/hooks/useChainId'
import { type PropsWithChildren, useCallback, useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createTx } from '@/services/tx/tx-sender'
import useSafeInfo from '@/hooks/useSafeInfo'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

export const RemoveSpendingLimitReview = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{
  params: SpendingLimitState
  onSubmit: () => void
}>) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const chainId = useChainId()
  const { safe } = useSafeInfo()

  useEffect(() => {
    if (!safe.modules?.length) return

    const spendingLimitAddress = getDeployedSpendingLimitModuleAddress(chainId, safe.modules)
    if (!spendingLimitAddress) return

    const spendingLimitInterface = getSpendingLimitInterface()
    const txData = spendingLimitInterface.encodeFunctionData('deleteAllowance', [
      params.beneficiary,
      params.token.address,
    ])

    const txParams = {
      to: spendingLimitAddress,
      value: '0',
      data: txData,
    }

    createTx(txParams).then(setSafeTx).catch(setSafeTxError)
  }, [chainId, params.beneficiary, params.token, setSafeTx, setSafeTxError, safe.modules])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.SPENDING_LIMIT.LIMIT_REMOVED)
    onSubmit()
  }, [onSubmit])

  return <ReviewTransaction onSubmit={onFormSubmit}>{children}</ReviewTransaction>
}
