import ChainIndicator from '@/components/common/ChainIndicator'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import partition from 'lodash/partition'
import css from './styles.module.css'
import { type ReactElement, useId, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const NetworkInput = ({
  name,
  required = false,
  chainConfigs,
}: {
  name: string
  required?: boolean
  chainConfigs: (Chain & { available: boolean })[]
}): ReactElement => {
  const id = useId()
  const [testNets, prodNets] = useMemo(() => partition(chainConfigs, (config) => config.isTestnet), [chainConfigs])
  const { control } = useFormContext() || {}

  const renderItem = (chainId: string, isDisabled: boolean) => {
    const chain = chainConfigs.find((chain) => chain.chainId === chainId)
    if (!chain) return null
    return (
      <SelectItem disabled={isDisabled} key={chainId} value={chainId} className={css.item}>
        <ChainIndicator chainId={chain.chainId} />
        {isDisabled && (
          <Typography variant="paragraph-mini" className={css.disabledChip}>
            Not available
          </Typography>
        )}
      </SelectItem>
    )
  }

  return (
    <Controller
      name={name}
      rules={{ required }}
      control={control}
      render={({ field }) => (
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor={id}>Network</Label>
          <Select
            value={field.value || null}
            onValueChange={field.onChange}
            onOpenChange={(isOpen) => !isOpen && field.onBlur()}
          >
            <SelectTrigger id={id} aria-label="Network" className="w-full">
              <SelectValue>
                {(value) => {
                  const chain = chainConfigs.find((chain) => chain.chainId === value)
                  return chain ? <ChainIndicator chainId={chain.chainId} /> : null
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {prodNets.map((chain) => renderItem(chain.chainId, !chain.available))}

              {testNets.length > 0 && <div className={css.listSubHeader}>Testnets</div>}

              {testNets.map((chain) => renderItem(chain.chainId, !chain.available))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  )
}

export default NetworkInput
