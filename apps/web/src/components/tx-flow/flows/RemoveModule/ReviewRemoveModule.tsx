import { useCallback, useContext, useEffect, type PropsWithChildren } from 'react'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { type RemoveModuleFlowProps } from '.'
import EthHashInfo from '@/components/common/EthHashInfo'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { ReviewRemoveModuleView } from '@views/components/tx-flow/flows/RemoveModule/ReviewRemoveModuleView'

export const ReviewRemoveModule = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: RemoveModuleFlowProps; onSubmit: () => void }>) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createRemoveModuleTx(params.address).then(setSafeTx).catch(setSafeTxError)
  }, [params.address, setSafeTx, setSafeTxError])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.MODULES.REMOVE_MODULE)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <ReviewRemoveModuleView address={params.address} renderAddress={(props) => <EthHashInfo {...props} />} />

      {children}
    </ReviewTransaction>
  )
}
