import SettingsChangeTxInfo from '@/components/transactions/TxDetails/TxData/SettingsChange'
import {
  isStakingTxExitInfo,
  isBridgeOrderTxInfo,
  isExecTxData,
  isLifiSwapTxInfo,
  isOnChainConfirmationTxData,
  isSafeUpdateTxData,
  isStakingTxWithdrawInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
  isCancellationTxInfo,
  isCustomTxInfo,
  isMigrateToL2TxData,
  isMultisigDetailedExecutionInfo,
  isMultiSendTxInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isSpendingLimitMethod,
  isStakingTxDepositInfo,
  isSupportedSpendingLimitAddress,
  isTransferTxInfo,
  type SpendingLimitMethods,
} from '@/utils/transaction-guards'
import { SpendingLimits } from '@/components/transactions/TxDetails/TxData/SpendingLimits'
import { TransactionStatus, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { PropsWithChildren, ReactElement } from 'react'
import RejectionTxInfo from '@/components/transactions/TxDetails/TxData/Rejection'
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
import VaultDepositTxDetails from '@/features/earn/components/VaultDepositTxDetails'
import VaultRedeemTxDetails from '@/features/earn/components/VaultRedeemTxDetails'
import DecodedData from './DecodedData'
import { ErrorBoundary } from '@sentry/react'
import Multisend from './DecodedData/Multisend'
import BridgeTransaction from '@/components/tx/confirmation-views/BridgeTransaction'
import { LifiSwapTransaction } from '@/components/tx/confirmation-views/LifiSwapTransaction'

const TxData = ({
  txInfo,
  txData,
  txDetails,
  trusted,
  imitation,
  children,
}: PropsWithChildren<{
  txInfo: TransactionDetails['txInfo']
  txData: TransactionDetails['txData']
  txDetails?: TransactionDetails
  trusted: boolean
  imitation: boolean
}>): ReactElement => {
  const chainId = useChainId()

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

  // @ts-ignore: TODO: Fix this type
  if (isVaultDepositTxInfo(txInfo)) {
    return <VaultDepositTxDetails info={txInfo} />
  }

  // @ts-ignore: TODO: Fix this type
  if (isVaultRedeemTxInfo(txInfo)) {
    return <VaultRedeemTxDetails info={txInfo} />
  }

  if (isBridgeOrderTxInfo(txInfo)) {
    return <BridgeTransaction txInfo={txInfo} />
  }

  if (isLifiSwapTxInfo(txInfo)) {
    return <LifiSwapTransaction txInfo={txInfo} isPreview={false} />
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

  return !!children ? (
    <>{children}</>
  ) : (
    <>
      <DecodedData txData={txData} toInfo={isCustomTxInfo(txInfo) ? txInfo.to : txData?.to} />

      {(isMultiSendTxInfo(txInfo) || isOrderTxInfo(txInfo)) && (
        <ErrorBoundary fallback={<div>Error parsing data</div>}>
          <Multisend txData={txData} isExecuted={!!txDetails?.executedAt} />
        </ErrorBoundary>
      )}
    </>
  )
}

export default TxData
