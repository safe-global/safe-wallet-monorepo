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
import TokenAmount from '@/components/common/TokenAmount'
import {
  isOrderTxInfo,
  isCreationTxInfo,
  isCustomTxInfo,
  isERC20Transfer,
  isERC721Transfer,
  isMultiSendTxInfo,
  isNativeTokenTransfer,
  isSettingsChangeTxInfo,
  isTransferTxInfo,
  isMigrateToL2TxInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
} from '@/utils/transaction-guards'
import { ellipsis, maybePlural, shortenAddress } from '@safe-global/utils/utils/formatters'
import { useCurrentChain } from '@/hooks/useChains'
import { StakingTxDepositInfo, StakingTxExitInfo, StakingTxWithdrawInfo } from './Staking'
import css from './styles.module.css'
import { VaultDepositTxInfo, VaultRedeemTxInfo } from '@/features/earn'
import { SwapTx } from './SwapTx'

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

  if (isNativeTokenTransfer(transfer)) {
    return (
      <TokenAmount
        direction={direction}
        value={transfer.value ?? '0'}
        decimals={nativeCurrency?.decimals}
        tokenSymbol={nativeCurrency?.symbol}
        logoUri={withLogo ? nativeCurrency?.logoUri : undefined}
        preciseAmount={preciseAmount}
        iconSize={iconSize}
      />
    )
  }

  if (isERC20Transfer(transfer)) {
    return (
      <TokenAmount
        {...transfer}
        direction={direction}
        logoUri={withLogo ? transfer?.logoUri : undefined}
        preciseAmount={preciseAmount}
        iconSize={iconSize}
      />
    )
  }

  if (isERC721Transfer(transfer)) {
    return (
      <TokenAmount
        {...transfer}
        tokenSymbol={ellipsis(
          `${transfer.tokenSymbol ? transfer.tokenSymbol : 'Unknown NFT'} #${transfer.tokenId}`,
          withLogo ? 16 : 100,
        )}
        value="1"
        decimals={0}
        direction={undefined}
        logoUri={withLogo ? transfer?.logoUri : undefined}
        fallbackSrc="/images/common/nft-placeholder.png"
        iconSize={iconSize}
      />
    )
  }

  return <></>
}

const CustomTx = ({ info }: { info: CustomTransactionInfo }): ReactElement => {
  return <div className={css.txInfo}>{info.methodName}</div>
}

const CreationTx = ({ info }: { info: CreationTransactionInfo }): ReactElement => {
  return <div className={css.txInfo}>Created by {shortenAddress(info.creator.value)}</div>
}

const MultiSendTx = ({ info }: { info: MultiSendTransactionInfo }): ReactElement => {
  return (
    <div className={css.txInfo}>
      {info.actionCount} {`action${maybePlural(info.actionCount)}`}
    </div>
  )
}

const SettingsChangeTx = ({ info }: { info: SettingsChangeTransaction }): ReactElement => {
  if (
    info.settingsInfo?.type === SettingsInfoType.ENABLE_MODULE ||
    info.settingsInfo?.type === SettingsInfoType.DISABLE_MODULE
  ) {
    return <div className={css.txInfo}>{info.settingsInfo.module.name}</div>
  }
  return <></>
}

const MigrationToL2Tx = (): ReactElement => {
  return <>Migrate base contract</>
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
