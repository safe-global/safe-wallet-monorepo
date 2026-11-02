import { getSpendingLimitInterface } from '../../services/spendingLimitContracts'
import { getDeployedSpendingLimitModuleAddress } from '../../services/spendingLimitDeployments'
import useChainId from '@/hooks/useChainId'
import { type PropsWithChildren, useCallback, useContext, useEffect } from 'react'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import type { SpendingLimitState } from '@safe-global/views/features/spending-limits/types'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { createTx } from '@/services/tx/tx-sender/create'
import useSafeInfo from '@/hooks/useSafeInfo'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

const RemoveSpendingLimitReview = ({
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

export default RemoveSpendingLimitReview
