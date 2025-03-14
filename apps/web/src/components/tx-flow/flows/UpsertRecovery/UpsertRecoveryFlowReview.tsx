import { SvgIcon, Tooltip, Typography } from '@mui/material'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Errors, logError } from '@/services/exceptions'
import { getRecoveryUpsertTransactions } from '@/features/recovery/services/setup'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { isSmartContractWallet } from '@/utils/wallets'
import { UpsertRecoveryFlowFields } from '.'
import { TOOLTIP_TITLES } from '../../common/constants'
import { useRecoveryPeriods } from './useRecoveryPeriods'
import type { UpsertRecoveryFlowProps } from '.'
import { isCustomDelaySelected } from './utils'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

enum AddressType {
  EOA = 'EOA',
  Safe = 'Safe',
  Other = 'Other',
}

const getAddressType = async (address: string, chainId: string) => {
  const isSmartContract = await isSmartContractWallet(chainId, address)
  if (!isSmartContract) return AddressType.EOA

  const isSafeContract = await getSafeInfo(chainId, address)
  if (isSafeContract) return AddressType.Safe

  return AddressType.Other
}

export function UpsertRecoveryFlowReview({
  params,
  moduleAddress,
  onSubmit,
}: {
  params: UpsertRecoveryFlowProps
  moduleAddress?: string
  onSubmit: () => void
}): ReactElement {
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)
  const periods = useRecoveryPeriods()

  const { recoverer, expiry, delay, customDelay, selectedDelay } = params
  const isCustomDelay = isCustomDelaySelected(selectedDelay)

  const expiryLabel = periods.expiration.find(({ value }) => value === params[UpsertRecoveryFlowFields.expiry])!.label
  const delayLabel = isCustomDelay
    ? `${customDelay} days`
    : periods.delay.find(({ value }) => value === selectedDelay)?.label

  useEffect(() => {
    if (!web3ReadOnly) {
      return
    }

    getRecoveryUpsertTransactions({
      ...params,
      provider: web3ReadOnly,
      chainId: safe.chainId,
      safeAddress,
      moduleAddress,
    })
      .then((transactions) => {
        return transactions.length > 1 ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
      })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [moduleAddress, params, safe.chainId, safeAddress, setSafeTx, setSafeTxError, web3ReadOnly])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._809, safeTxError.message)
    }
  }, [safeTxError])

  const handleSubmit = async (
    isEdit: boolean,
    params: Omit<UpsertRecoveryFlowProps, 'customDelay' | 'selectedDelay'>,
    chainId: string,
  ) => {
    const addressType = await getAddressType(params.recoverer, chainId)
    const creationEvent = isEdit ? RECOVERY_EVENTS.SUBMIT_RECOVERY_EDIT : RECOVERY_EVENTS.SUBMIT_RECOVERY_CREATE
    const settings = `delay_${params.delay},expiry_${params.expiry},type_${addressType}`

    trackEvent({ ...creationEvent })
    trackEvent({ ...RECOVERY_EVENTS.RECOVERY_SETTINGS, label: settings })

    onSubmit()
  }

  const isEdit = !!moduleAddress

  return (
    <ReviewTransaction onSubmit={() => handleSubmit(isEdit, { recoverer, expiry, delay }, safe.chainId)}>
      <Typography>
        This transaction will {moduleAddress ? 'update' : 'enable'} the Account recovery feature once executed.
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
    </ReviewTransaction>
  )
}
