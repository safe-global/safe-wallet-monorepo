import type { ReactElement, ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import css from './styles.module.css'

export type NetworkOption = { chainId: string; available: boolean }

export type NetworkInputViewProps = {
  id: string
  required: boolean
  hasError: boolean
  value: string | null
  onValueChange: (value: string | null) => void
  onBlur: () => void
  chainIds: string[]
  prodNets: NetworkOption[]
  testNets: NetworkOption[]
  /** Renders the ChainIndicator container for a chain */
  renderChain: (chainId: string) => ReactNode
}

export function NetworkInputView({
  id,
  required,
  hasError,
  value,
  onValueChange,
  onBlur,
  chainIds,
  prodNets,
  testNets,
  renderChain,
}: NetworkInputViewProps): ReactElement {
  const renderItem = (chainId: string, isDisabled: boolean) => {
    if (!chainIds.includes(chainId)) return null
    return (
      <SelectItem disabled={isDisabled} key={chainId} value={chainId} className={css.item}>
        {renderChain(chainId)}
        {isDisabled && (
          <Typography variant="paragraph-mini" className={css.disabledChip}>
            Not available
          </Typography>
        )}
      </SelectItem>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={id} className={hasError ? 'text-destructive' : undefined}>
        Network
      </Label>
      <Select value={value} onValueChange={onValueChange} onOpenChange={(isOpen) => !isOpen && onBlur()}>
        <SelectTrigger id={id} aria-label="Network" aria-invalid={hasError || undefined} className="w-full">
          <SelectValue>
            {(selected) => {
              if (typeof selected === 'string' && chainIds.includes(selected)) return renderChain(selected)
              return required ? null : 'Optional'
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
  )
}
