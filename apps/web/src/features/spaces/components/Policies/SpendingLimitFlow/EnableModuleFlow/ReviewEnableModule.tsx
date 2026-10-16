import { useContext, useEffect, useMemo, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { isAllowanceModuleAddress } from '@/features/spending-limits/services'
import useAddressBook from '@/hooks/useAddressBook'
import { getAndValidateSafeSDK } from '@/services/tx/tx-sender/sdk'
import type { PolicySafe, PolicySpender } from '@safe-global/views/features/spaces/components/Policies/types'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import SpendingLimitSummary from '../Summary'
import { toEnableModuleSummaryModel } from '../Summary/toEnableModuleSummaryModel'
import {
  MODULE_ALREADY_ENABLED_ERROR,
  REVIEW_STEP_TITLE,
  UNKNOWN_MODULE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'

export type EnableModuleFlowData = {
  safe: PolicySafe
  moduleAddress: string
  spenders: PolicySpender[]
}

const ReviewEnableModule = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<EnableModuleFlowData>>(TxFlowContext)
  const { safeTx, safeTxError, setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const names = useAddressBook()
  const { accounts } = useSpendingLimitSafeAccounts()

  const moduleAddress = data?.moduleAddress
  const chainId = scope?.chainId
  const sdk = scope?.sdk
  const modules = scope?.safe?.modules
  const safeLoaded = scope?.safeLoaded ?? false
  const moduleKey = modules?.map((module) => module.value.toLowerCase()).join(',')

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(undefined)
    if (!moduleAddress || !chainId || !sdk || !safeLoaded) return

    // The address comes from the Policy Indexer, so it is never enabled unless it is a known AllowanceModule.
    if (!isAllowanceModuleAddress(chainId, moduleAddress)) {
      setSafeTxError(new Error(UNKNOWN_MODULE_ERROR))
      return
    }
    if (modules?.some((module) => sameAddress(module.value, moduleAddress))) {
      setSafeTxError(new Error(MODULE_ALREADY_ENABLED_ERROR))
      return
    }

    let isStale = false
    getAndValidateSafeSDK(scope)
      .createEnableModuleTx(moduleAddress)
      .then((tx) => {
        if (!isStale) setSafeTx(tx)
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(e)
      })
    return () => {
      isStale = true
    }
    // `scope` and `modules` are new objects on every Safe poll; the SDK and the module addresses stand in for them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleAddress, chainId, sdk, safeLoaded, moduleKey, setSafeTx, setSafeTxError])

  const summary = useMemo(
    () => (data ? toEnableModuleSummaryModel(data.safe, data.spenders, { accounts, names }) : undefined),
    [data, accounts, names],
  )

  if (!safeTx && !safeTxError) {
    return (
      <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  return (
    <ReviewTransaction title={REVIEW_STEP_TITLE} onSubmit={onSubmit}>
      {summary && <SpendingLimitSummary policy={summary} />}
      {children}
    </ReviewTransaction>
  )
}

export default ReviewEnableModule
