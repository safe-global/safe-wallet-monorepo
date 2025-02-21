import SettingsChangeTxInfo from '@/components/transactions/TxDetails/TxData/SettingsChange'
import type { SpendingLimitMethods } from '@/utils/transaction-guards'
import {
  isExecTxData,
  isOnChainConfirmationTxData,
  isSafeUpdateTxData,
  isStakingTxWithdrawInfo,
} from '@/utils/transaction-guards'
import { isStakingTxExitInfo } from '@/utils/transaction-guards'
import {
  isCancellationTxInfo,
  isCustomTxInfo,
  isMigrateToL2TxData,
  isMultisigDetailedExecutionInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isSpendingLimitMethod,
  isStakingTxDepositInfo,
  isSupportedSpendingLimitAddress,
  isTransferTxInfo,
} from '@/utils/transaction-guards'
import { SpendingLimits } from '@/components/transactions/TxDetails/TxData/SpendingLimits'
import { DetailedExecutionInfoType, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { type ReactElement } from 'react'
import RejectionTxInfo from '@/components/transactions/TxDetails/TxData/Rejection'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import TransferTxInfo from '@/components/transactions/TxDetails/TxData/Transfer'
import useChainId from '@/hooks/useChainId'
import { MigrationToL2TxData } from './MigrationToL2TxData'
import SwapOrder from '@/features/swap/components/SwapOrder'
import StakingTxDepositDetails from '@/features/stake/components/StakingTxDepositDetails'
import StakingTxExitDetails from '@/features/stake/components/StakingTxExitDetails'
import StakingTxWithdrawDetails from '@/features/stake/components/StakingTxWithdrawDetails'
import { OnChainConfirmation } from './NestedTransaction/OnChainConfirmation'
import { ExecTransaction } from './NestedTransaction/ExecTransaction'
import SafeUpdate from './SafeUpdate'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { skipToken } from '@reduxjs/toolkit/query'
import { sameAddress } from '@/utils/addresses'
import SafenetSettlement from '@/features/safenet/components/SafenetSettlement'
import useHasSafenetFeature from '@/features/safenet/hooks/useHasSafenetFeature'

const TxData = ({
  txDetails,
  trusted,
  imitation,
}: {
  txDetails: TransactionDetails
  trusted: boolean
  imitation: boolean
}): ReactElement => {
  const chainId = useChainId()
  const isSafenetEnabled = useHasSafenetFeature()

  const txInfo = txDetails.txInfo
  const toInfo = isCustomTxInfo(txDetails.txInfo) ? txDetails.txInfo.to : undefined

  const moduleAddress =
    txDetails.detailedExecutionInfo?.type === DetailedExecutionInfoType.MODULE
      ? txDetails.detailedExecutionInfo.address.value
      : undefined

  const { data: safenetConfig } = useGetSafenetConfigQuery(isSafenetEnabled && moduleAddress ? undefined : skipToken)
  const isSafenetSettlement = sameAddress(safenetConfig?.settlementEngines[chainId], moduleAddress)

  if (isSafenetSettlement) {
    return <SafenetSettlement data={txDetails} />
  }
  if (isOrderTxInfo(txDetails.txInfo)) {
    return <SwapOrder txData={txDetails.txData} txInfo={txDetails.txInfo} />
  }

  if (isStakingTxDepositInfo(txDetails.txInfo)) {
    return <StakingTxDepositDetails txData={txDetails.txData} info={txDetails.txInfo} />
  }

  if (isStakingTxExitInfo(txDetails.txInfo)) {
    return <StakingTxExitDetails info={txDetails.txInfo} />
  }

  if (isStakingTxWithdrawInfo(txDetails.txInfo)) {
    return <StakingTxWithdrawDetails info={txDetails.txInfo} />
  }

  if (isTransferTxInfo(txInfo)) {
    return <TransferTxInfo txInfo={txInfo} txStatus={txDetails.txStatus} trusted={trusted} imitation={imitation} />
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    return <SettingsChangeTxInfo settingsInfo={txInfo.settingsInfo} />
  }

  if (isCancellationTxInfo(txInfo) && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    return <RejectionTxInfo nonce={txDetails.detailedExecutionInfo?.nonce} isTxExecuted={!!txDetails.executedAt} />
  }

  const method = txDetails.txData?.dataDecoded?.method as SpendingLimitMethods
  if (isCustomTxInfo(txInfo) && isSupportedSpendingLimitAddress(txInfo, chainId) && isSpendingLimitMethod(method)) {
    return <SpendingLimits txData={txDetails.txData} txInfo={txInfo} type={method} />
  }

  if (isMigrateToL2TxData(txDetails.txData, chainId)) {
    return <MigrationToL2TxData txDetails={txDetails} />
  }

  if (isOnChainConfirmationTxData(txDetails.txData)) {
    return <OnChainConfirmation data={txDetails.txData} />
  }

  if (isExecTxData(txDetails.txData)) {
    return <ExecTransaction data={txDetails.txData} />
  }

  if (isSafeUpdateTxData(txDetails.txData)) {
    return <SafeUpdate txData={txDetails.txData} />
  }

  return <DecodedData txData={txDetails.txData} toInfo={toInfo} />
}

export default TxData
