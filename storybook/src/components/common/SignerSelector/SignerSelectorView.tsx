import { useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/utils/cn'

import css from './styles.module.css'

export type SignerOption = { address: string; disabled: boolean; disabledReason?: string }

export type SignerSelectorViewProps = {
  options: SignerOption[]
  value: string | undefined
  onChange: (address: string) => void
  label?: string
  /** Renders the EthHashInfo container for an address */
  renderAddress: (props: { address: string; avatarSize: number; onlyName: boolean; copyAddress: boolean }) => ReactNode
}

export function SignerSelectorView({
  options,
  value,
  onChange,
  label,
  renderAddress,
}: SignerSelectorViewProps): ReactElement {
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
                selected
                  ? renderAddress({ address: selected as string, avatarSize: 32, onlyName: true, copyAddress: false })
                  : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((owner) => (
              <SelectItem key={owner.address} value={owner.address} disabled={owner.disabled}>
                {renderAddress({ address: owner.address, avatarSize: 32, onlyName: true, copyAddress: false })}
                {owner.disabled && owner.disabledReason !== undefined && (
                  <Typography variant="paragraph-mini" className={css.disabledPill}>
                    {owner.disabledReason}
                  </Typography>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
