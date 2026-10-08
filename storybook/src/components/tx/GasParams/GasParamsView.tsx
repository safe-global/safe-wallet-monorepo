import type { ReactElement, SyntheticEvent } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { type AdvancedParameters } from '@views/components/tx/AdvancedParams/types'
import classnames from 'classnames'
import css from './styles.module.css'
import accordionCss from '@/styles/accordion.module.css'

const GasDetail = ({ name, value, isLoading }: { name: string; value: string; isLoading: boolean }): ReactElement => {
  const valueSkeleton = <Skeleton className="inline-block h-4 min-w-[5em]" />
  return (
    <div className="flex">
      <div className="flex-1">{name}</div>
      <div>{value || (isLoading ? valueSkeleton : '-')}</div>
    </div>
  )
}

export type GasParamsViewProps = {
  params: AdvancedParameters
  isExecution: boolean
  isEIP1559?: boolean
  hasGasLimitError: boolean
  willRelay?: boolean
  isNoFeeCampaignEligible?: boolean
  isLoading: boolean
  isError: boolean
  totalFee?: string
  nativeCurrencySymbol?: string
  showEdit: boolean
  onEditClick: (e: SyntheticEvent) => void
  onChangeExpand: (value: unknown[]) => void
}

export const GasParamsView = ({
  params,
  isExecution,
  isEIP1559,
  hasGasLimitError,
  willRelay,
  isNoFeeCampaignEligible,
  isLoading,
  isError,
  totalFee = '> 0.001',
  nativeCurrencySymbol,
  showEdit,
  onEditClick,
  onChangeExpand,
}: GasParamsViewProps): ReactElement => {
  const { nonce, userNonce, safeTxGas, gasLimit, maxFeePerGas, maxPriorityFeePerGas } = params

  // Individual gas params
  const gasLimitString = gasLimit?.toString() || ''
  const maxFeePerGasGwei = maxFeePerGas ? formatVisualAmount(maxFeePerGas) : ''
  const maxPrioGasGwei = maxPriorityFeePerGas ? formatVisualAmount(maxPriorityFeePerGas) : ''

  const EditComponent = (
    <>
      {hasGasLimitError || !isExecution || (isExecution && !isLoading) ? (
        <Link render={<button type="button" />} onClick={onEditClick} className="mt-4 text-base font-bold">
          Edit
        </Link>
      ) : (
        <Skeleton className="mt-4 inline-block h-4 min-w-[2em]" />
      )}
    </>
  )

  return (
    <div className={classnames(css.container, { [css.error]: hasGasLimitError })}>
      <Accordion onValueChange={onChangeExpand}>
        <AccordionItem value="gas-params" className="border-b-0">
          <AccordionTrigger className={classnames(accordionCss.accordion, 'items-center px-4')}>
            {isExecution ? (
              <span className="flex w-full items-center">
                <span className="flex-1">Estimated fee </span>
                {hasGasLimitError ? (
                  <>
                    <WarningIcon className="mr-[var(--space-1)] size-4 text-[var(--color-error-main)]" />
                    <span className="font-normal">Cannot estimate</span>
                  </>
                ) : isLoading ? (
                  <Skeleton className="inline-block h-4 min-w-[7em]" />
                ) : (
                  <div className={css.feeContainer}>
                    {isNoFeeCampaignEligible ? (
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
                      <span>{willRelay ? 'Free' : `${totalFee} ${nativeCurrencySymbol}`}</span>
                    )}
                  </div>
                )}
              </span>
            ) : (
              <span>
                Signing the transaction with nonce&nbsp;
                {nonce !== undefined ? nonce : <Skeleton className="inline-block h-4 min-w-[2em]" />}
              </span>
            )}
          </AccordionTrigger>

          <AccordionContent className="px-4 pt-4">
            {nonce !== undefined && (
              <GasDetail isLoading={false} name="Safe account transaction nonce" value={nonce.toString()} />
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

            {showEdit && EditComponent}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
