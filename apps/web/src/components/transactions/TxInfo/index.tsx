import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type {
  CreationTransactionInfo,
  CustomTransactionInfo,
  MultiSendTransactionInfo,
  SettingsChangeTransaction,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useMemo } from 'react'
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
import { StakingTxDepositInfo, StakingTxExitInfo, StakingTxWithdrawInfo } from './Staking'
import { Box } from '@mui/material'
import css from './styles.module.css'
import { VaultDepositTxInfo, VaultRedeemTxInfo } from '@/features/earn'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectCustomAbisByChain } from '@/store/customAbiSlice'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useCustomAbiDecoding from '@/hooks/useCustomAbiDecoding'

export const TransferTx = ({
  info,
  omitSign = false,
  withLogo = true,
  preciseAmount = false,
}: {
  info: TransferTransactionInfo
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
        value={transfer.value ?? '0'}
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

const useCustomMethodName = (info: CustomTransactionInfo, txId?: string): string | null | undefined => {
  const chainId = useChainId()
  const customAbis = useAppSelector((state) => selectCustomAbisByChain(state, chainId))
  const toAddress = info.to.value
  const hasCustomAbi = !!customAbis[toAddress]
  const shouldFetch = !info.methodName && hasCustomAbi && !!txId

  const { data: txDetails } = useTransactionsGetTransactionByIdV1Query(
    { chainId, id: txId || '' },
    { skip: !shouldFetch },
  )

  const hexData = shouldFetch ? txDetails?.txData?.hexData : undefined
  const customDecoded = useCustomAbiDecoding(hexData ?? null, toAddress)

  return useMemo(() => info.methodName || customDecoded?.method || null, [info.methodName, customDecoded?.method])
}

const CustomTx = ({ info, txId }: { info: CustomTransactionInfo; txId?: string }): ReactElement => {
  const methodName = useCustomMethodName(info, txId)
  return <Box className={css.txInfo}>{methodName}</Box>
}

const CreationTx = ({ info }: { info: CreationTransactionInfo }): ReactElement => {
  return <Box className={css.txInfo}>Created by {shortenAddress(info.creator.value)}</Box>
}

const MultiSendTx = ({ info }: { info: MultiSendTransactionInfo }): ReactElement => {
  return (
    <Box className={css.txInfo}>
      {info.actionCount} {`action${maybePlural(info.actionCount)}`}
    </Box>
  )
}

const SettingsChangeTx = ({ info }: { info: SettingsChangeTransaction }): ReactElement => {
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

const TxInfo = ({
  info,
  txId,
  ...rest
}: {
  info: TransactionInfo
  txId?: string
  omitSign?: boolean
  withLogo?: boolean
}): ReactElement => {
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
    return <CustomTx info={info} txId={txId} />
  }

  return <></>
}

export default TxInfo
