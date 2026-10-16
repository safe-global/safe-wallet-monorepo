import { useContext, useEffect, type ComponentType, type ReactElement } from 'react'
import type { MetaTransactionData } from '@safe-global/types-kit'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxFlowType } from '@/services/analytics'
import { TxFlow, type SubmitCallback } from '../../TxFlow'
import { SafeTxContext } from '../../SafeTxProvider'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

type PolicyBatchData = {
  txs: MetaTransactionData[]
}

/**
 * Lightweight review step that hydrates the SafeTxContext from a prebuilt
 * batch. Lets policy wizards skip their own form steps and hand a finished
 * multi-send straight to the standard tx-flow modal (Safe Shield, simulation,
 * sign/propose machinery).
 */
export const PolicyBatchReview = ({ onSubmit, children }: ReviewTransactionProps) => {
  const { data } = useContext<TxFlowContextType<PolicyBatchData>>(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  // Space-scoped wizards navigate into the Safe right before opening this flow,
  // so the SDK singleton is initialized a few renders later. Gate the build on
  // it (and keep it in the deps) — otherwise the first attempt throws "SDK could
  // not be initialized" and, with no SDK in the deps, never retries.
  const safeSDK = useSafeSDK()

  useEffect(() => {
    if (!data?.txs?.length || !safeSDK) return
    createMultiSendCallOnlyTx(data.txs).then(setSafeTx).catch(setSafeTxError)
  }, [data, safeSDK, setSafeTx, setSafeTxError])

  return <ReviewTransaction onSubmit={onSubmit}>{children}</ReviewTransaction>
}

type PolicyBatchFlowProps = {
  txs: MetaTransactionData[]
  subtitle: string
  icon?: ComponentType
  onSubmit?: SubmitCallback
}

const PolicyBatchFlow = ({ txs, subtitle, icon = SaveAddressIcon, onSubmit }: PolicyBatchFlowProps): ReactElement => (
  <TxFlow<PolicyBatchData>
    initialData={{ txs }}
    subtitle={subtitle}
    icon={icon}
    ReviewTransactionComponent={PolicyBatchReview}
    onSubmit={onSubmit}
    eventCategory={TxFlowType.SETUP_SPENDING_LIMIT}
  />
)

export default PolicyBatchFlow
