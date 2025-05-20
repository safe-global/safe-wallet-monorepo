import { type ReactElement } from 'react'
import type {
  Creation,
  Custom,
  MultiSend,
  SettingsChange,
  TransactionInfo,
  Transfer,
} from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType } from '@safe-global/safe-gateway-typescript-sdk'
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
import { SwapTx } from '@/features/swap/components/SwapTxInfo/SwapTx'
import StakingTxExitInfo from '@/features/stake/components/StakingTxExitInfo'
import StakingTxWithdrawInfo from '@/features/stake/components/StakingTxWithdrawInfo'
import { Box } from '@mui/material'
import css from './styles.module.css'
import StakingTxDepositInfo from '@/features/stake/components/StakingTxDepositInfo'
import VaultDepositTxInfo from '@/features/earn/components/VaultDepositTxInfo'
import VaultRedeemTxInfo from '@/features/earn/components/VaultRedeemTxInfo'

export const TransferTx = ({
  info,
  omitSign = false,
  withLogo = true,
  preciseAmount = false,
}: {
  info: Transfer
  omitSign?: boolean
  withLogo?: boolean
  preciseAmount?: boolean
}): ReactElement => {
  const chainConfig = useCurrentChain()
  const { nativeCurrency } = chainConfig || {}
  const transfer = info.transferInfo
  const direction = omitSign ? undefined : info.direction

  if (isNativeTokenTransfer(transfer)) {
    return (
      <TokenAmount
        direction={direction}
        value={transfer.value}
        decimals={nativeCurrency?.decimals}
        tokenSymbol={nativeCurrency?.symbol}
        logoUri={withLogo ? nativeCurrency?.logoUri : undefined}
        preciseAmount={preciseAmount}
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
      />
    )
  }

  return <></>
}

const CustomTx = ({ info }: { info: Custom }): ReactElement => {
  return <Box className={css.txInfo}>{info.methodName}</Box>
}

const CreationTx = ({ info }: { info: Creation }): ReactElement => {
  return <Box className={css.txInfo}>Created by {shortenAddress(info.creator.value)}</Box>
}

const MultiSendTx = ({ info }: { info: MultiSend }): ReactElement => {
  return (
    <Box className={css.txInfo}>
      {info.actionCount} {`action${maybePlural(info.actionCount)}`}
    </Box>
  )
}

const SettingsChangeTx = ({ info }: { info: SettingsChange }): ReactElement => {
  if (
    info.settingsInfo?.type === SettingsInfoType.ENABLE_MODULE ||
    info.settingsInfo?.type === SettingsInfoType.DISABLE_MODULE
  ) {
    return <Box className={css.txInfo}>{info.settingsInfo.module.name}</Box>
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
