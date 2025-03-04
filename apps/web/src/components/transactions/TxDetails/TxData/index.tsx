import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import RejectionTxInfo from '@/components/transactions/TxDetails/TxData/Rejection'
import SettingsChangeTxInfo from '@/components/transactions/TxDetails/TxData/SettingsChange'
import { SpendingLimits } from '@/components/transactions/TxDetails/TxData/SpendingLimits'
import TransferTxInfo from '@/components/transactions/TxDetails/TxData/Transfer'
import SafenetSettlement from '@/features/safenet/components/SafenetSettlement'
import useHasSafenetFeature from '@/features/safenet/hooks/useHasSafenetFeature'
import StakingTxDepositDetails from '@/features/stake/components/StakingTxDepositDetails'
import StakingTxExitDetails from '@/features/stake/components/StakingTxExitDetails'
import StakingTxWithdrawDetails from '@/features/stake/components/StakingTxWithdrawDetails'
import SwapOrder from '@/features/swap/components/SwapOrder'
import useChainId from '@/hooks/useChainId'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import type { SpendingLimitMethods } from '@/utils/transaction-guards'
import {
  isCancellationTxInfo,
  isCustomTxInfo,
  isExecTxData,
  isMigrateToL2TxData,
  isMultisigDetailedExecutionInfo,
  isOnChainConfirmationTxData,
  isOrderTxInfo,
  isSafeUpdateTxData,
  isSettingsChangeTxInfo,
  isSpendingLimitMethod,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isSupportedSpendingLimitAddress,
  isTransferTxInfo,
} from '@/utils/transaction-guards'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  DetailedExecutionInfoType,
  TransactionStatus,
  type TransactionDetails,
} from '@safe-global/safe-gateway-typescript-sdk'
import { type ReactElement } from 'react'
import { MigrationToL2TxData } from './MigrationToL2TxData'
import { ExecTransaction } from './NestedTransaction/ExecTransaction'
import { OnChainConfirmation } from './NestedTransaction/OnChainConfirmation'
import SafeUpdate from './SafeUpdate'

const TxData = ({
  txInfo,
  txData,
  txDetails,
  trusted,
  imitation,
}: {
  txInfo: TransactionDetails['txInfo']
  txData: TransactionDetails['txData']
  txDetails?: TransactionDetails
  trusted: boolean
  imitation: boolean
}): ReactElement => {
  const chainId = useChainId()
  const isSafenetEnabled = useHasSafenetFeature()

  const toInfo = isCustomTxInfo(txInfo) ? txInfo.to : undefined

  const moduleAddress =
    txDetails?.detailedExecutionInfo?.type === DetailedExecutionInfoType.MODULE
      ? txDetails.detailedExecutionInfo.address.value
      : undefined

  const { data: safenetConfig } = useGetSafenetConfigQuery(isSafenetEnabled && moduleAddress ? undefined : skipToken)
  const isSafenetSettlement = sameAddress(safenetConfig?.settlementEngines[chainId], moduleAddress)

  if (isSafenetSettlement && txDetails) {
    return <SafenetSettlement data={txDetails} />
  }

  if (isOrderTxInfo(txInfo)) {
    return <SwapOrder txData={txData} txInfo={txInfo} />
  }

  if (isStakingTxDepositInfo(txInfo)) {
    return <StakingTxDepositDetails txData={txData} info={txInfo} />
  }

  if (isStakingTxExitInfo(txInfo)) {
    return <StakingTxExitDetails info={txInfo} />
  }

  if (isStakingTxWithdrawInfo(txInfo)) {
    return <StakingTxWithdrawDetails info={txInfo} />
  }

  if (isTransferTxInfo(txInfo)) {
    return (
      <TransferTxInfo
        txInfo={txInfo}
        txStatus={txDetails?.txStatus ?? TransactionStatus.AWAITING_CONFIRMATIONS}
        trusted={trusted}
        imitation={imitation}
      />
    )
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    return <SettingsChangeTxInfo settingsInfo={txInfo.settingsInfo} isTxExecuted={!!txDetails?.executedAt} />
  }

  if (txDetails && isCancellationTxInfo(txInfo) && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    return <RejectionTxInfo nonce={txDetails.detailedExecutionInfo?.nonce} isTxExecuted={!!txDetails.executedAt} />
  }

  if (
    isCustomTxInfo(txInfo) &&
    isSupportedSpendingLimitAddress(txInfo, chainId) &&
    isSpendingLimitMethod(txData?.dataDecoded?.method)
  ) {
    return <SpendingLimits txData={txData} txInfo={txInfo} type={txData?.dataDecoded?.method as SpendingLimitMethods} />
  }

  if (txDetails && isMigrateToL2TxData(txData, chainId)) {
    return <MigrationToL2TxData txDetails={txDetails} />
  }

  if (isOnChainConfirmationTxData(txData)) {
    return <OnChainConfirmation data={txData} />
  }

  if (isExecTxData(txData)) {
    return <ExecTransaction data={txData} />
  }

  if (isSafeUpdateTxData(txData)) {
    return <SafeUpdate txData={txData} />
  }

  return <DecodedData txData={txData} toInfo={toInfo} />
}

export default TxData
