import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { Controller, useFormContext } from 'react-hook-form'
import classNames from 'classnames'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'

import css from './styles.module.css'
import { TokenAmountFields } from '@/components/tx-flow/flows/TokenTransfer/types'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { TokenTransferType, MultiTransfersFields } from '@/components/tx-flow/flows/TokenTransfer'

const SpendingLimitRow = ({
  availableAmount,
  selectedToken,
}: {
  availableAmount: bigint
  selectedToken: Balance['tokenInfo'] | undefined
}) => {
  const { control, trigger, resetField } = useFormContext()
  const canCreateStandardTx = useHasPermission(Permission.CreateTransaction)
  const canCreateSpendingLimitTx = useHasPermission(Permission.CreateSpendingLimitTransaction, {
    tokenAddress: selectedToken?.address,
  })
  const { setNonceNeeded } = useContext(SafeTxContext)

  const formattedAmount = safeFormatUnits(availableAmount, selectedToken?.decimals)

  useEffect(() => {
    return () => {
      // reset the field value to default when the component is unmounted
      resetField(MultiTransfersFields.type)
    }
  }, [resetField])

  return (
    <div className="flex flex-col">
      <Label className="mb-1">
        Send as <span className="text-destructive">*</span>
      </Label>
      <Controller
        rules={{ required: true }}
        control={control}
        name={MultiTransfersFields.type}
        render={({ field: { onChange, value } }) => (
          <RadioGroup
            value={value}
            onValueChange={(newValue) => {
              onChange(newValue)

              setNonceNeeded(newValue === TokenTransferType.multiSig)

              // Validate only after the field is changed
              setTimeout(() => {
                trigger(TokenAmountFields.amount)
              }, 10)
            }}
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
                      <span>
                        <InfoIcon className="text-border ml-1 inline-block size-4 align-middle" />
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
                Spending limit <b>{`(${formattedAmount} ${selectedToken?.symbol})`}</b>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span>
                        <InfoIcon className="text-border ml-1 inline-block size-4 align-middle" />
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
        )}
      />
    </div>
  )
}

export default SpendingLimitRow
