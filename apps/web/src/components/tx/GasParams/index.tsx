import type { ReactElement, SyntheticEvent } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { useCurrentChain } from '@/hooks/useChains'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { type AdvancedParameters } from '../AdvancedParams/types'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import classnames from 'classnames'
import css from './styles.module.css'
import accordionCss from '@/styles/accordion.module.css'
import madProps from '@/utils/mad-props'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'

const GasDetail = ({ name, value, isLoading }: { name: string; value: string; isLoading: boolean }): ReactElement => {
  const valueSkeleton = <Skeleton className="inline-block h-4 min-w-[5em]" />
  return (
    <div className="flex">
      <div className="flex-1">{name}</div>
      <div>{value || (isLoading ? valueSkeleton : '-')}</div>
    </div>
  )
}

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
  const { nonce, userNonce, safeTxGas, gasLimit, maxFeePerGas, maxPriorityFeePerGas } = params
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
    : '> 0.001'

  // Individual gas params
  const gasLimitString = gasLimit?.toString() || ''
  const maxFeePerGasGwei = maxFeePerGas ? formatVisualAmount(maxFeePerGas) : ''
  const maxPrioGasGwei = maxPriorityFeePerGas ? formatVisualAmount(maxPriorityFeePerGas) : ''

  const onEditClick = (e: SyntheticEvent) => {
    e.preventDefault()
    onEdit?.()
  }

  const EditComponent = (
    <>
      {gasLimitError || !isExecution || (isExecution && !isLoading) ? (
        <Link render={<button type="button" />} onClick={onEditClick} className="mt-4 text-base">
          Edit
        </Link>
      ) : (
        <Skeleton className="mt-4 inline-block h-4 min-w-[2em]" />
      )}
    </>
  )

  return (
    <div className={classnames({ [css.error]: gasLimitError })}>
      <Accordion onValueChange={onChangeExpand}>
        <AccordionItem
          value="gas-params"
          className={classnames('border-b-0', { [css.withExecutionMethod]: isExecution })}
        >
          <AccordionTrigger className={classnames(accordionCss.accordion, 'px-4')}>
            {isExecution ? (
              <span className="flex w-full items-center text-base font-normal">
                <span className="flex-1">Estimated fee </span>
                {gasLimitError ? (
                  <>
                    <WarningIcon className="mr-[var(--space-1)] size-4 text-[var(--color-error-main)]" />
                    <span className="font-normal">Cannot estimate</span>
                  </>
                ) : isLoading ? (
                  <Skeleton className="inline-block h-4 min-w-[7em]" />
                ) : (
                  <div className={css.feeContainer}>
                    {noFeeCampaign?.isEligible ? (
                      <>
                        <span className={css.feeAmount}>Free</span>
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className={css.noFeeCampaignTag}>Free January Sponsored</span>}
                          />
                          <TooltipContent>
                            As a USDe holder, you are eligible for the gas sponsorship program
                          </TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <span>{willRelay ? 'Free' : `${totalFee} ${chain?.nativeCurrency.symbol}`}</span>
                    )}
                  </div>
                )}
              </span>
            ) : (
              <span className="text-base font-normal">
                Signing the transaction with nonce&nbsp;
                {nonce !== undefined ? nonce : <Skeleton className="inline-block h-4 min-w-[2em]" />}
              </span>
            )}
          </AccordionTrigger>

          <AccordionContent className="px-4">
            {nonce !== undefined && (
              <GasDetail isLoading={false} name="Safe Account transaction nonce" value={nonce.toString()} />
            )}

            {safeTxGas !== undefined && <GasDetail isLoading={false} name="safeTxGas" value={safeTxGas.toString()} />}

            {isExecution && (
              <>
                {userNonce !== undefined && (
                  <GasDetail isLoading={false} name="Wallet nonce" value={userNonce.toString()} />
                )}

                <GasDetail
                  isLoading={isLoading}
                  name="Gas limit"
                  value={isError ? 'Cannot estimate' : gasLimitString}
                />

                {isEIP1559 ? (
                  <>
                    <GasDetail isLoading={isLoading} name="Max priority fee (Gwei)" value={maxPrioGasGwei} />
                    <GasDetail isLoading={isLoading} name="Max fee (Gwei)" value={maxFeePerGasGwei} />
                  </>
                ) : (
                  <GasDetail isLoading={isLoading} name="Gas price (Gwei)" value={maxFeePerGasGwei} />
                )}
              </>
            )}

            {onEdit && EditComponent}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

const GasParams = madProps(_GasParams, {
  chain: useCurrentChain,
})

export default GasParams
