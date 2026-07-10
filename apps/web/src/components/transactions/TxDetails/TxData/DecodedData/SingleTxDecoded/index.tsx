import type { MultiSend, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SyntheticEvent } from 'react'
import { isEmptyHexData } from '@/utils/hex'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Code } from 'lucide-react'
import css from './styles.module.css'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import { cn } from '@/utils/cn'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeToL2MigrationDeployment } from '@safe-global/safe-deployments'
import { useCurrentChain } from '@/hooks/useChains'
import { type TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { InlineTransferTxInfo } from '../../Transfer'
import { useTransferTokenInfo } from './useTransferTokenInfo'

type OnAccordionChange = (event: SyntheticEvent, expanded: boolean) => void

type SingleTxDecodedProps = {
  tx: MultiSend
  txData: TransactionData
  actionTitle: string
  variant?: 'elevation' | 'outlined'
  expanded?: boolean
  onChange?: OnAccordionChange
  isExecuted?: boolean
  actions?: React.ReactNode
}

const SingleTxDecoded = ({
  tx,
  txData,
  actionTitle,
  variant,
  expanded,
  onChange,
  isExecuted = false,
  actions,
}: SingleTxDecodedProps) => {
  const chain = useCurrentChain()
  const isNativeTransfer = tx.value !== '0' && (!tx.data || isEmptyHexData(tx.data))
  const method = tx.dataDecoded?.method || (isNativeTransfer ? 'native transfer' : 'contract interaction')

  const addressInfo = txData.addressInfoIndex?.[tx.to]
  const name = addressInfo?.name

  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = chain && safeToL2MigrationDeployment?.networkAddresses[chain.chainId]
  const tokenInfoIndex = (txData as TransactionDetails['txData'])?.tokenInfoIndex

  const txDataHex = tx.data ?? '0x'

  const transferTokenInfo = useTransferTokenInfo(txDataHex, tx.value, tx.to, tokenInfoIndex)

  const accordionProps = onChange
    ? {
        value: expanded ? ['action'] : [],
        onValueChange: (value: string[], details?: { event?: Event }) =>
          onChange(details?.event as unknown as SyntheticEvent, value.includes('action')),
      }
    : { defaultValue: expanded ? ['action'] : [] }

  const isGrouped = variant === 'outlined'

  const singleTxData = {
    to: { value: tx.to },
    value: tx.value,
    operation: tx.operation,
    dataDecoded: tx.dataDecoded,
    hexData: tx.data ?? undefined,
    addressInfoIndex: txData.addressInfoIndex,
    trustedDelegateCallTarget: sameAddress(tx.to, safeToL2MigrationAddress),
  }

  const accordionBody = (
    <>
      <AccordionTrigger
        data-testid="action-item"
        render={<div role="button" tabIndex={0} />}
        className={cn(
          'flex min-h-12 items-center px-4 py-3 hover:no-underline',
          isGrouped ? css.groupedTrigger : css.outlinedTrigger,
          isGrouped && expanded && css.groupedTriggerOpen,
        )}
      >
        <div className={css.summary}>
          <Code className="size-4 shrink-0 text-muted-foreground" />
          <span className={css.summaryIndex}>{actionTitle}</span>
          {transferTokenInfo ? (
            <InlineTransferTxInfo
              value={transferTokenInfo.transferValue}
              tokenInfo={transferTokenInfo.tokenInfo}
              recipient={transferTokenInfo.recipient}
            />
          ) : (
            <Typography className={css.summaryLabel}>
              {name ? `${name}: ` : ''}
              <b>{method}</b>
            </Typography>
          )}
        </div>

        {actions !== undefined && <div className={css.actions}>{actions}</div>}
      </AccordionTrigger>

      <AccordionContent className={cn('px-4', isGrouped && 'border-t border-border bg-card')}>
        <div className="flex flex-col gap-2">
          <DecodedData txData={singleTxData} toInfo={{ value: tx.to }} isTxExecuted={isExecuted} />
        </div>
      </AccordionContent>
    </>
  )

  return (
    <Accordion data-testid="action-accordion" {...accordionProps}>
      <AccordionItem value="action" className={cn(isGrouped ? 'border-0' : 'border-b border-border last:border-b-0')}>
        {isGrouped ? accordionBody : <Card size="none">{accordionBody}</Card>}
      </AccordionItem>
    </Accordion>
  )
}

export default SingleTxDecoded
