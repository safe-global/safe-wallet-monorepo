import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { FEATURES, getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { AdvancedParameters } from '@safe-global/views/components/tx/AdvancedParams/types'
import type {
  GasDetailName,
  GasDetailRow,
  GasFeeDetails,
  GasParamField,
  NetworkFee,
} from '@safe-global/views/features/fee-payment/types'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import {
  fromGasParamsDraft,
  isSameGasParamsDraft,
  toGasParamsDraft,
  validateGasParamsDraft,
  type GasParamsDraft,
} from '../services/gasParamsDraft'
import type { GasPayerSelection } from './useGasPayerSelection'

type DraftField = keyof GasParamsDraft

const EIP1559_FIELDS: DraftField[] = ['userNonce', 'gasLimit', 'maxPriorityFeePerGas', 'maxFeePerGas']
const LEGACY_FIELDS: DraftField[] = ['userNonce', 'gasLimit', 'maxFeePerGas']

// Without EIP-1559 the max fee is the gas price, and the view labels it as such.
const detailName = (field: DraftField, isEIP1559: boolean): GasDetailName =>
  !isEIP1559 && field === 'maxFeePerGas' ? 'gasPrice' : field
const draftField = (name: GasDetailName): DraftField | undefined =>
  name === 'gasPrice' ? 'maxFeePerGas' : name === 'refundReceiver' ? undefined : name

const formatGwei = (value: bigint | null | undefined): string | undefined =>
  value === null || value === undefined ? undefined : safeFormatUnits(value)

/** The gas the Safe pays for at most, and its price, as signed (or about to be) with the relay quote. */
const safePaysRows = (data: SafeTransaction['data'] | undefined): GasDetailRow[] => {
  const isNativeGasToken = !data || sameAddress(data.gasToken, ZERO_ADDRESS)
  return [
    { name: 'gasLimit', value: data ? (BigInt(data.safeTxGas) + BigInt(data.baseGas)).toString() : undefined },
    // A gas price in an ERC-20 isn't in Gwei.
    ...(isNativeGasToken
      ? [{ name: 'gasPrice' as const, value: data ? formatGwei(BigInt(data.gasPrice)) : undefined }]
      : []),
    { name: 'refundReceiver' },
  ]
}

const walletRows = (params: AdvancedParameters, isEIP1559: boolean, cannotEstimate: boolean): GasDetailRow[] => [
  { name: 'gasLimit', value: params.gasLimit?.toString(), error: cannotEstimate },
  ...(isEIP1559
    ? [
        { name: 'maxPriorityFeePerGas' as const, value: formatGwei(params.maxPriorityFeePerGas) },
        { name: 'maxFeePerGas' as const, value: formatGwei(params.maxFeePerGas) },
      ]
    : [{ name: 'gasPrice' as const, value: formatGwei(params.maxFeePerGas) }]),
]

/**
 * The gas settings of the execution, inside the Fees card's Gas fee row: editable while the signer wallet pays,
 * read-only when the Safe or a sponsor does. The card's gas fee follows the settings the signer will submit.
 */
export const useGasFeeDetails = ({
  selection,
  safeTx,
  params,
  estimate,
  onParamsChange,
  gasLimitError,
}: {
  selection: GasPayerSelection
  safeTx?: SafeTransaction
  /** The settings that will be submitted: the estimate with the user's edits. */
  params: AdvancedParameters
  estimate: AdvancedParameters
  /** Undefined goes back to the live estimate. */
  onParamsChange: (params?: AdvancedParameters) => void
  gasLimitError?: Error
}): { selection: GasPayerSelection; gasFeeDetails?: GasFeeDetails } => {
  const chain = useCurrentChain()
  const isEIP1559 = !!useHasFeature(FEATURES.EIP1559)
  const [draft, setDraft] = useState<GasParamsDraft | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [wasAutoOpened, setWasAutoOpened] = useState(false)

  const { view, isPayFromSafe } = selection
  const { showGasFeeEstimation } = chain?.features ? getNativeTokenDisplay(chain) : NATIVE_TOKEN_DISPLAY_DEFAULT
  const isEditable = !!view && !isPayFromSafe && !view.sponsored
  const cannotEstimate = !!gasLimitError && !params.gasLimit

  // Switching to a payer that can't edit drops the draft.
  useEffect(() => {
    if (!isEditable) setDraft(null)
  }, [isEditable])

  // When the gas can't be estimated, the editor opens once by itself to ask for a gas limit.
  useEffect(() => {
    if (!isEditable || !cannotEstimate || wasAutoOpened) return
    setWasAutoOpened(true)
    setDraft(toGasParamsDraft(params))
  }, [isEditable, cannotEstimate, wasAutoOpened, params])

  const onEditOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return setDraft(null)
      setDraft(toGasParamsDraft(params))
      trackEvent(MODALS_EVENTS.EDIT_ADVANCED_PARAMS)
    },
    [params],
  )

  const onViewOpenChange = useCallback((open: boolean) => {
    setIsViewOpen(open)
    trackEvent({ ...MODALS_EVENTS.ESTIMATION, label: open ? 'Open' : 'Close' })
  }, [])

  const walletFee = useMemo<NetworkFee>(() => {
    if (cannotEstimate) return { error: true }
    if (!params.gasLimit || !params.maxFeePerGas) return { loading: true }
    return {
      amount: getTotalFeeFormatted(params.maxFeePerGas, params.gasLimit, chain),
      currency: chain?.nativeCurrency.symbol,
    }
  }, [cannotEstimate, params.gasLimit, params.maxFeePerGas, chain])

  const cardSelection = useMemo<GasPayerSelection>(
    () =>
      // The Safe's fee comes from the relay quote, not from these settings.
      view && showGasFeeEstimation && !isPayFromSafe
        ? { ...selection, view: { ...view, gasFee: walletFee } }
        : selection,
    [selection, view, showGasFeeEstimation, isPayFromSafe, walletFee],
  )

  const gasFeeDetails = useMemo<GasFeeDetails | undefined>(() => {
    if (!view || !showGasFeeEstimation) return undefined

    if (isPayFromSafe) {
      const data = selection.isLocked ? safeTx?.data : selection.fees.previewedSafeTx?.data
      return {
        mode: 'view',
        open: isViewOpen,
        onOpenChange: onViewOpenChange,
        rows: safePaysRows(data),
        reason: 'PAID_FROM_SAFE',
      }
    }

    if (view.sponsored) {
      return {
        mode: 'view',
        open: isViewOpen,
        onOpenChange: onViewOpenChange,
        rows: walletRows(params, isEIP1559, cannotEstimate),
        reason: view.sponsorKind === 'plan' ? 'SPONSORED_PLAN' : 'SPONSORED_FREE',
      }
    }

    const errors = draft ? validateGasParamsDraft(draft, isEIP1559) : {}
    const estimateDraft = toGasParamsDraft(estimate)
    const fields: GasParamField[] = (isEIP1559 ? EIP1559_FIELDS : LEGACY_FIELDS).map((field) => ({
      name: detailName(field, isEIP1559),
      value: draft?.[field] ?? '',
      error: errors[field],
      autoFocus: field === 'gasLimit' && cannotEstimate,
    }))

    return {
      mode: 'edit',
      open: draft !== null,
      onOpenChange: onEditOpenChange,
      fields,
      onFieldChange: (name, value) => {
        const field = draftField(name)
        if (field) setDraft((current) => (current ? { ...current, [field]: value } : current))
      },
      canSave: Object.keys(errors).length === 0,
      onSave: () => {
        if (!draft || Object.keys(errors).length > 0) return
        // Saving the estimate unchanged goes back to following it.
        onParamsChange(isSameGasParamsDraft(draft, estimateDraft) ? undefined : fromGasParamsDraft(draft))
        setDraft(null)
      },
      onCancel: () => setDraft(null),
      onReset:
        draft && estimate.gasLimit && !isSameGasParamsDraft(draft, estimateDraft)
          ? () => setDraft(estimateDraft)
          : undefined,
    }
  }, [
    view,
    showGasFeeEstimation,
    isPayFromSafe,
    selection.isLocked,
    selection.fees.previewedSafeTx,
    safeTx,
    isViewOpen,
    onViewOpenChange,
    params,
    isEIP1559,
    cannotEstimate,
    draft,
    estimate,
    onEditOpenChange,
    onParamsChange,
  ])

  return { selection: cardSelection, gasFeeDetails }
}
