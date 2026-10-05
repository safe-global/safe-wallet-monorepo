import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { getRecoveryUpsertTransactions } from '@/features/recovery/services'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { TOOLTIP_TITLES } from '../../common/constants'
import type { UpsertRecoveryFlowProps } from '.'
import { formatRecoveryPeriod } from './utils'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function UpsertRecoveryFlowReview({ children, ...props }: ReviewTransactionProps): ReactElement {
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const { data } = useContext<TxFlowContextType<UpsertRecoveryFlowProps>>(TxFlowContext)

  useEffect(() => {
    if (!web3ReadOnly || !data) {
      return
    }

    getRecoveryUpsertTransactions({
      ...data,
      provider: web3ReadOnly,
      chainId: safe.chainId,
      safeAddress,
    })
      .then((transactions) => {
        return transactions.length > 1 ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
      })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [data, safe.chainId, safeAddress, setSafeTx, setSafeTxError, web3ReadOnly])

  const isEdit = !!data?.moduleAddress

  if (!data) {
    return <ErrorMessage>No data provided</ErrorMessage>
  }

  const { recoverer, delay, expiry } = data
  const expirySeconds = Number(expiry)

  return (
    <ReviewTransaction {...props}>
      <Typography>
        This transaction will {isEdit ? 'update' : 'enable'} the Account recovery feature once executed.
      </Typography>

      <TxDataRow title="Trusted Recoverer">
        <EthHashInfo address={recoverer} showName={false} hasExplorer showCopyButton avatarSize={24} />
      </TxDataRow>

      <TxDataRow
        title={
          <>
            Review window
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
              </TooltipTrigger>
              <TooltipContent>{TOOLTIP_TITLES.REVIEW_WINDOW}</TooltipContent>
            </Tooltip>
          </>
        }
      >
        {formatRecoveryPeriod(Number(delay))}
      </TxDataRow>

      {expirySeconds !== 0 && (
        <TxDataRow
          title={
            <>
              Proposal expiry
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{TOOLTIP_TITLES.PROPOSAL_EXPIRY}</TooltipContent>
              </Tooltip>
            </>
          }
        >
          {formatRecoveryPeriod(expirySeconds)}
        </TxDataRow>
      )}

      {children}
    </ReviewTransaction>
  )
}
