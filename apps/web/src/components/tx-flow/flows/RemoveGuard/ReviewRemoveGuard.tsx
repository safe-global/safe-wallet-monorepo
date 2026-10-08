import { useCallback, useContext, useEffect, type PropsWithChildren } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveGuardTx } from '@/services/tx/tx-sender'
import { type RemoveGuardFlowProps } from '.'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { ReviewRemoveGuardView } from '@views/components/tx-flow/flows/RemoveGuard/ReviewRemoveGuardView'

export const ReviewRemoveGuard = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: RemoveGuardFlowProps; onSubmit: () => void }>) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createRemoveGuardTx().then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.MODULES.REMOVE_GUARD)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <ReviewRemoveGuardView address={params.address} renderAddress={(props) => <EthHashInfo {...props} />} />

      {children}
    </ReviewTransaction>
  )
}
