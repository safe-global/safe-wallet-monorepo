import type { TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import {
  isAnyStakingTxInfo,
  isCustomTxInfo,
  isExecTxData,
  isOnChainConfirmationTxData,
  isSafeMigrationTxData,
  isSafeUpdateTxData,
  isSwapOrderTxInfo,
  isTwapOrderTxInfo,
} from '@/utils/transaction-guards'
import { type ReactNode, useContext, useMemo } from 'react'
import TxData from '@/components/transactions/TxDetails/TxData'
import type { NarrowConfirmationViewProps } from './types'
import SettingsChange from './SettingsChange'
import ChangeThreshold from './ChangeThreshold'
import BatchTransactions from './BatchTransactions'
import { TxModalContext } from '@/components/tx-flow'
import { isSettingsChangeView, isChangeThresholdView, isConfirmBatchView } from './utils'
import { OnChainConfirmation } from '@/components/transactions/TxDetails/TxData/NestedTransaction/OnChainConfirmation'
import { ExecTransaction } from '@/components/transactions/TxDetails/TxData/NestedTransaction/ExecTransaction'
import { type ReactElement } from 'react'
import SwapOrder from './SwapOrder'
import StakingTx from './StakingTx'
import UpdateSafe from './UpdateSafe'
import { MigrateToL2Information } from './MigrateToL2Information'
import { NestedSafeCreation } from './NestedSafeCreation'
import { isNestedSafeCreation } from '@/utils/nested-safes'
import Summary from '@/components/transactions/TxDetails/Summary'

type ConfirmationViewProps = {
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
  safeTx?: SafeTransaction
  isBatch?: boolean
  isApproval?: boolean
  isCreation?: boolean
  children?: ReactNode
}

const getConfirmationViewComponent = ({
  txInfo,
  txData,
  txFlow,
}: NarrowConfirmationViewProps & { txFlow?: ReactElement }) => {
  if (isChangeThresholdView(txInfo)) return <ChangeThreshold txInfo={txInfo} />

  if (isConfirmBatchView(txFlow)) return <BatchTransactions />

  if (isSettingsChangeView(txInfo)) return <SettingsChange txInfo={txInfo as SettingsChange} />

  if (isOnChainConfirmationTxData(txData)) return <OnChainConfirmation data={txData} isConfirmationView />

  if (isExecTxData(txData)) return <ExecTransaction data={txData} isConfirmationView />

  if (isSwapOrderTxInfo(txInfo) || isTwapOrderTxInfo(txInfo)) return <SwapOrder txInfo={txInfo} txData={txData} />

  if (isAnyStakingTxInfo(txInfo)) return <StakingTx txInfo={txInfo} />

  if (isCustomTxInfo(txInfo) && isSafeUpdateTxData(txData)) return <UpdateSafe txData={txData} />

  if (isCustomTxInfo(txInfo) && isSafeMigrationTxData(txData)) {
    return <MigrateToL2Information variant="queue" txData={txData} />
  }

  if (isCustomTxInfo(txInfo) && txData && isNestedSafeCreation(txData)) {
    return <NestedSafeCreation txData={txData} />
  }

  return null
}

const ConfirmationView = ({ safeTx, txPreview, txDetails, ...props }: ConfirmationViewProps) => {
  const { txFlow } = useContext(TxModalContext)
  const details = txDetails ?? txPreview

  const ConfirmationViewComponent = useMemo(() => {
    return details
      ? getConfirmationViewComponent({
          txInfo: details.txInfo,
          txData: details.txData,
          txFlow,
        })
      : undefined
  }, [details, txFlow])

  return (
    <>
      {ConfirmationViewComponent ||
        (details && (
          <TxData txData={details?.txData} txInfo={details?.txInfo} txDetails={txDetails} imitation={false} trusted />
        ))}

      {props.children}

      <Summary safeTxData={safeTx?.data} txDetails={txDetails} txData={details?.txData} txInfo={details?.txInfo} />
    </>
  )
}

export default ConfirmationView
