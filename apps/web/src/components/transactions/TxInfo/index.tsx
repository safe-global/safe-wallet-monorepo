import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type {
  CreationTransactionInfo,
  CustomTransactionInfo,
  MultiSendTransactionInfo,
  SettingsChangeTransaction,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement } from 'react'
import {
  isOrderTxInfo,
  isCreationTxInfo,
  isCustomTxInfo,
  isMultiSendTxInfo,
  isSettingsChangeTxInfo,
  isTransferTxInfo,
  isMigrateToL2TxInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
} from '@/utils/transaction-guards'
import { useCurrentChain } from '@/hooks/useChains'
import { StakingTxDepositInfo, StakingTxExitInfo, StakingTxWithdrawInfo } from './Staking'
import { VaultDepositTxInfo, VaultRedeemTxInfo } from '@/features/earn'
import { SwapTx } from '@views/components/transactions/TxInfo/SwapTx'
import {
  CreationTxView,
  CustomTxView,
  MigrationToL2TxView,
  MultiSendTxView,
  SettingsChangeTxView,
  TransferTxView,
} from '@views/components/transactions/TxInfo/TxInfoView'

export const TransferTx = ({
  info,
  omitSign = false,
  withLogo = true,
  preciseAmount = false,
  iconSize,
}: {
  info: TransferTransactionInfo
  omitSign?: boolean
  withLogo?: boolean
  preciseAmount?: boolean
  iconSize?: number
}): ReactElement => {
  const chainConfig = useCurrentChain()
  const { nativeCurrency } = chainConfig || {}
  const transfer = info.transferInfo
  const direction = omitSign ? undefined : info.direction

  return (
    <TransferTxView
      transfer={transfer}
      direction={direction}
      nativeCurrency={nativeCurrency}
      withLogo={withLogo}
      preciseAmount={preciseAmount}
      iconSize={iconSize}
    />
  )
}

const CustomTx = ({ info }: { info: CustomTransactionInfo }): ReactElement => {
  return <CustomTxView methodName={info.methodName} />
}

const CreationTx = ({ info }: { info: CreationTransactionInfo }): ReactElement => {
  return <CreationTxView creator={info.creator.value} />
}

const MultiSendTx = ({ info }: { info: MultiSendTransactionInfo }): ReactElement => {
  return <MultiSendTxView actionCount={info.actionCount} />
}

const SettingsChangeTx = ({ info }: { info: SettingsChangeTransaction }): ReactElement => {
  if (
    info.settingsInfo?.type === SettingsInfoType.ENABLE_MODULE ||
    info.settingsInfo?.type === SettingsInfoType.DISABLE_MODULE
  ) {
    return <SettingsChangeTxView moduleName={info.settingsInfo.module.name} />
  }
  return <></>
}

const MigrationToL2Tx = (): ReactElement => {
  return <MigrationToL2TxView />
}

const TxInfo = ({ info, ...rest }: { info: TransactionInfo; omitSign?: boolean; withLogo?: boolean }): ReactElement => {
  if (isSettingsChangeTxInfo(info)) {
    return <SettingsChangeTx info={info} />
  }

  if (isMultiSendTxInfo(info)) {
    return <MultiSendTx info={info} />
  }

  if (isTransferTxInfo(info)) {
    return <TransferTx info={info} {...rest} />
  }

  if (isMigrateToL2TxInfo(info)) {
    return <MigrationToL2Tx />
  }

  if (isCreationTxInfo(info)) {
    return <CreationTx info={info} />
  }

  if (isOrderTxInfo(info)) {
    return <SwapTx info={info} />
  }

  if (isStakingTxDepositInfo(info)) {
    return <StakingTxDepositInfo info={info} />
  }

  if (isStakingTxExitInfo(info)) {
    return <StakingTxExitInfo info={info} />
  }

  if (isStakingTxWithdrawInfo(info)) {
    return <StakingTxWithdrawInfo info={info} />
  }

  if (isVaultDepositTxInfo(info)) {
    return <VaultDepositTxInfo txInfo={info} />
  }

  if (isVaultRedeemTxInfo(info)) {
    return <VaultRedeemTxInfo txInfo={info} />
  }

  if (isCustomTxInfo(info)) {
    return <CustomTx info={info} />
  }

  return <></>
}

export default TxInfo
