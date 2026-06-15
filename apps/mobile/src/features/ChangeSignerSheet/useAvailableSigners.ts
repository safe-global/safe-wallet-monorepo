import { useMemo } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { extractAppSigners } from '@/src/features/ConfirmTx/utils'
import { useGetBalancesQuery } from '@/src/store/signersBalance'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'

const useAvailableSigners = (txId: string, actionType: ActionType) => {
  const activeSafe = useDefinedActiveSafe()
  const signers = useAppSelector(selectSigners)
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const { data: txDetails, isLoading: isLoadingTxDetails } = useTransactionData(txId)

  const detailedExecutionInfo = txDetails?.detailedExecutionInfo as MultisigExecutionDetails

  const storedSigners = useMemo(() => extractAppSigners(signers, detailedExecutionInfo), [txDetails, signers])

  const { data, isLoading } = useGetBalancesQuery({
    addresses: storedSigners?.map((item) => item.value) || [],
    chain: activeChain,
  })

  const items = useMemo(() => {
    if (!data) {
      return []
    }

    const availableSigners =
      actionType === ActionType.SIGN
        ? storedSigners.filter((signer) => {
            return !detailedExecutionInfo?.confirmations?.some(
              (confirmation) => confirmation.signer.value === signer.value,
            )
          })
        : storedSigners

    return availableSigners.map((item) => ({
      ...item,
      balance: data[item.value],
    }))
  }, [data, storedSigners, detailedExecutionInfo])

  return { items, loading: isLoading || isLoadingTxDetails }
}

export default useAvailableSigners
