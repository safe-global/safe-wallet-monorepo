import type { ReactElement } from 'react'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { NativeCurrency } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import TokenAmount from '@/components/common/TokenAmount'
import { ellipsis, maybePlural, shortenAddress } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'

export type TransferTxViewProps = {
  transfer: TransferTransactionInfo['transferInfo']
  direction?: TransferTransactionInfo['direction']
  nativeCurrency?: NativeCurrency
  withLogo: boolean
  preciseAmount: boolean
  iconSize?: number
}

export const TransferTxView = ({
  transfer,
  direction,
  nativeCurrency,
  withLogo,
  preciseAmount,
  iconSize,
}: TransferTxViewProps): ReactElement => {
  if (transfer.type === 'NATIVE_COIN') {
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

  if (transfer.type === 'ERC20') {
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

  if (transfer.type === 'ERC721') {
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

export const CustomTxView = ({ methodName }: { methodName?: string | null }): ReactElement => {
  return <div className={css.txInfo}>{methodName}</div>
}

export const CreationTxView = ({ creator }: { creator: string }): ReactElement => {
  return <div className={css.txInfo}>Created by {shortenAddress(creator)}</div>
}

export const MultiSendTxView = ({ actionCount }: { actionCount: number }): ReactElement => {
  return (
    <div className={css.txInfo}>
      {actionCount} {`action${maybePlural(actionCount)}`}
    </div>
  )
}

export const SettingsChangeTxView = ({ moduleName }: { moduleName?: string | null }): ReactElement => {
  return <div className={css.txInfo}>{moduleName}</div>
}

export const MigrationToL2TxView = (): ReactElement => {
  return <>Migrate base contract</>
}
