import type { TokenInfo } from '@safe-global/store/gateway/policies/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { SelectionCheck } from '../wizardCommon'

type TokenSelectorProps = {
  tokens: TokenInfo[]
  selected: TokenInfo[]
  onChange: (tokens: TokenInfo[]) => void
}

export const TokenSelector = ({ tokens, selected, onChange }: TokenSelectorProps) => {
  const isSelected = (token: TokenInfo) => selected.some((s) => sameAddress(s.address, token.address))

  const toggle = (token: TokenInfo) => {
    onChange(isSelected(token) ? selected.filter((s) => !sameAddress(s.address, token.address)) : [...selected, token])
  }

  return (
    <div className="flex flex-col gap-2">
      {tokens.map((token) => (
        <button
          key={token.address}
          type="button"
          aria-pressed={isSelected(token)}
          onClick={() => toggle(token)}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-card p-3 text-left',
            isSelected(token) ? 'border-accent-success' : 'border-border',
          )}
        >
          <SelectionCheck selected={isSelected(token)} />
          <Typography variant="paragraph-small-bold">{token.symbol}</Typography>
        </button>
      ))}
    </div>
  )
}
