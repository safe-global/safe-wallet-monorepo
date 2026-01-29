import { SvgIcon, Tooltip, Typography } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Errors, logError } from '@/services/exceptions'
import { getRecoveryUpsertTransactions } from '@/features/recovery/services/setup'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { UpsertRecoveryFlowFields } from '.'
import { TOOLTIP_TITLES } from '../../common/constants'
import { useRecoveryPeriods } from './useRecoveryPeriods'
import type { UpsertRecoveryFlowProps } from '.'
import { isCustomDelaySelected } from './utils'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ErrorMessage from '@/components/tx/ErrorMessage'

export function UpsertRecoveryFlowReview({ children, ...props }: ReviewTransactionProps): ReactElement {
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)
  const periods = useRecoveryPeriods()

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

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._809, safeTxError.message)
    }
  }, [safeTxError])

  const isEdit = !!data?.moduleAddress

  if (!data) {
    return <ErrorMessage>No data provided</ErrorMessage>
  }

  const { recoverer, customDelay, selectedDelay } = data

  const isCustomDelay = isCustomDelaySelected(selectedDelay ?? '')

  const expiryLabel = periods.expiration.find(({ value }) => value === data?.[UpsertRecoveryFlowFields.expiry])!.label
  const delayLabel = isCustomDelay
    ? `${customDelay} days`
    : periods.delay.find(({ value }) => value === selectedDelay)?.label

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
            <Tooltip placement="top" title={TOOLTIP_TITLES.REVIEW_WINDOW}>
              <span>
                <SvgIcon
                  component={InfoIcon}
                  inheritViewBox
                  fontSize="small"
                  color="border"
                  sx={{ verticalAlign: 'middle', ml: 0.5 }}
                />
              </span>
            </Tooltip>
          </>
        }
      >
        {delayLabel}
      </TxDataRow>

      {expiryLabel !== '0' && (
        <TxDataRow
          title={
            <>
              Proposal expiry
              <Tooltip placement="top" title={TOOLTIP_TITLES.PROPOSAL_EXPIRY}>
                <span>
                  <SvgIcon
                    component={InfoIcon}
                    inheritViewBox
                    fontSize="small"
                    color="border"
                    sx={{ verticalAlign: 'middle', ml: 0.5 }}
                  />
                </span>
              </Tooltip>
            </>
          }
        >
          {expiryLabel}
        </TxDataRow>
      )}

      {children}
    </ReviewTransaction>
  )
}
