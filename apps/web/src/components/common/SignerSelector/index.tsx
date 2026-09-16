import { useId } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/utils/cn'

import css from './styles.module.css'

export type SignerSelectorProps = {
  options: string[]
  value: string | undefined
  onChange: (address: string) => void
  label?: string
  isOptionDisabled?: (address: string) => boolean
  disabledReason?: (address: string) => string
}

const SignerSelector = ({ options, value, onChange, label, isOptionDisabled, disabledReason }: SignerSelectorProps) => {
  const id = useId()
  const labelText = label ?? 'Signer account'

  return (
    <div className="flex items-center gap-2">
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor={id}>{labelText}</Label>
        <Select
          value={value || null}
          onValueChange={(next) => {
            if (next != null) onChange(next)
          }}
        >
          <SelectTrigger
            id={id}
            aria-label={labelText}
            className={cn(
              // faithful css-module port of `.signerForm` (border: 1px solid var(--color-border-light) !important),
              // pixel-identical; !important keeps the colour over the trigger's own focus-visible:border-ring
              'w-full border! border-solid! border-[var(--color-border-light)]!',
            )}
          >
            <SelectValue>
              {(selected) =>
                selected ? (
                  <EthHashInfo address={selected as string} avatarSize={32} onlyName copyAddress={false} />
                ) : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((owner) => {
              const disabled = isOptionDisabled?.(owner) ?? false
              return (
                <SelectItem key={owner} value={owner} disabled={disabled}>
                  <EthHashInfo address={owner} avatarSize={32} onlyName copyAddress={false} />
                  {disabled && disabledReason && (
                    <Typography variant="paragraph-mini" className={css.disabledPill}>
                      {disabledReason(owner)}
                    </Typography>
                  )}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default SignerSelector
