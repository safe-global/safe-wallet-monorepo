import type { ReactElement, SyntheticEvent } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { type AdvancedParameters } from '@views/components/tx/AdvancedParams/types'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import madProps from '@/utils/mad-props'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { GasParamsView } from '@views/components/tx/GasParams/GasParamsView'

type GasParamsProps = {
  params: AdvancedParameters
  isExecution: boolean
  isEIP1559?: boolean
  onEdit?: () => void
  gasLimitError?: Error
  willRelay?: boolean
  noFeeCampaign?: {
    isEligible: boolean
    remaining: number
    limit: number
  }
}

export const _GasParams = ({
  params,
  isExecution,
  isEIP1559,
  onEdit,
  gasLimitError,
  willRelay,
  noFeeCampaign,
  chain,
}: GasParamsProps & { chain?: Chain }): ReactElement => {
  const { gasLimit, maxFeePerGas } = params
  const { showGasFeeEstimation } = chain?.features ? getNativeTokenDisplay(chain) : NATIVE_TOKEN_DISPLAY_DEFAULT

  if (!showGasFeeEstimation) {
    return <></>
  }

  const onChangeExpand = (value: unknown[]) => {
    trackEvent({ ...MODALS_EVENTS.ESTIMATION, label: value.length > 0 ? 'Open' : 'Close' })
  }

  const isLoading = !gasLimit || !maxFeePerGas
  const isError = gasLimitError && !gasLimit

  // Total gas cost
  const totalFee = !isLoading
    ? formatVisualAmount(getTotalFee(maxFeePerGas, gasLimit), chain?.nativeCurrency.decimals)
    : undefined

  const onEditClick = (e: SyntheticEvent) => {
    e.preventDefault()
    onEdit?.()
  }

  return (
    <GasParamsView
      params={params}
      isExecution={isExecution}
      isEIP1559={isEIP1559}
      hasGasLimitError={!!gasLimitError}
      willRelay={willRelay}
      isNoFeeCampaignEligible={noFeeCampaign?.isEligible}
      isLoading={isLoading}
      isError={!!isError}
      totalFee={totalFee}
      nativeCurrencySymbol={chain?.nativeCurrency.symbol}
      showEdit={!!onEdit}
      onEditClick={onEditClick}
      onChangeExpand={onChangeExpand}
    />
  )
}

const GasParams = madProps(_GasParams, {
  chain: useCurrentChain,
})

export default GasParams
