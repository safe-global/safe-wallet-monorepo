import type { ReactElement, ReactNode } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import classNames from 'classnames'

import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'

import css from './styles.module.css'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TokenTransferType } from '@views/components/tx-flow/flows/TokenTransfer/types'

export type SendAsField = {
  value: string
  onValueChange: (newValue: unknown) => void
}

export type SpendingLimitRowViewProps = {
  canCreateStandardTx: boolean
  canCreateSpendingLimitTx: boolean
  formattedAmount: string
  tokenSymbol?: string
  renderController: (renderRadioGroup: (field: SendAsField) => ReactElement) => ReactNode
}

export const SpendingLimitRowView = ({
  canCreateStandardTx,
  canCreateSpendingLimitTx,
  formattedAmount,
  tokenSymbol,
  renderController,
}: SpendingLimitRowViewProps) => {
  return (
    <div className="flex flex-col">
      <Label className="mb-1">Send as</Label>
      {renderController(({ value, onValueChange }) => (
        <RadioGroup
          value={value}
          onValueChange={onValueChange}
          defaultValue={TokenTransferType.multiSig}
          className={cn('flex gap-0', css.group)}
        >
          {canCreateStandardTx && (
            <Label data-testid="standard-tx" className={`${css.label} flex items-center gap-2 text-sm font-normal`}>
              <RadioGroupItem value={TokenTransferType.multiSig} />
              Standard transaction
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex items-center">
                      <InfoIcon className="text-[var(--color-border-main)] ml-1 size-4 shrink-0" />
                    </span>
                  }
                />
                <TooltipContent>
                  A standard transaction requires the signatures of other signers before the specified funds can be
                  transferred.&nbsp;
                  <ExternalLink href={HelpCenterArticle.SPENDING_LIMITS} title="Learn more about spending limits">
                    Learn more about spending limits
                  </ExternalLink>
                  .
                </TooltipContent>
              </Tooltip>
            </Label>
          )}
          {canCreateSpendingLimitTx && (
            <Label
              data-testid="spending-limit-tx"
              className={classNames(`${css.label} flex items-center gap-2 text-sm font-normal`, {
                [css.spendingLimit]: canCreateStandardTx,
              })}
            >
              <RadioGroupItem value={TokenTransferType.spendingLimit} />
              Spending limit <b>{`(${formattedAmount} ${tokenSymbol})`}</b>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex items-center">
                      <InfoIcon className="text-[var(--color-border-main)] ml-1 size-4 shrink-0" />
                    </span>
                  }
                />
                <TooltipContent>
                  A spending limit transaction allows you to transfer the specified funds without the need to collect
                  the signatures of other signers.&nbsp;
                  <ExternalLink href={HelpCenterArticle.SPENDING_LIMITS} title="Learn more about spending limits">
                    Learn more about spending limits
                  </ExternalLink>
                  .
                </TooltipContent>
              </Tooltip>
            </Label>
          )}
        </RadioGroup>
      ))}
    </div>
  )
}
