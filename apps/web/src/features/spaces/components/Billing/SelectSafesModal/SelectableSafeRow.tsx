import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import ChainIndicator from '@/components/common/ChainIndicator'
import useSafeCardData from '../../SelectSafesOnboarding/hooks/useSafeCardData'
import FiatBalance from '../../SelectSafesOnboarding/components/FiatBalance'
import css from './styles.module.css'

interface SelectableSafeRowProps {
  safe: SafeItem | MultiChainSafeItem
  checked: boolean
  onToggle: () => void
}

const SelectableSafeRow = ({ safe, checked, onToggle }: SelectableSafeRowProps) => {
  const { name, fiatValue, chainIds } = useSafeCardData(safe)
  const displayName = name || shortenAddress(safe.address)
  const initial = name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Select ${displayName}`}
      onClick={onToggle}
      className={css.row}
    >
      <Checkbox checked={checked} tabIndex={-1} aria-hidden className={css.checkbox} />

      <div className={`${css.card} ${checked ? css.cardChecked : css.cardUnchecked}`}>
        <span className={css.avatar} aria-hidden>
          {initial}
        </span>

        <div className={css.details}>
          <span className={css.name}>{displayName}</span>
          <span className={css.address}>{shortenAddress(safe.address)}</span>
        </div>

        <div className={css.chains}>
          {chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} onlyLogo inline imageSize={20} />
          ))}
        </div>

        <FiatBalance value={fiatValue} />
      </div>
    </button>
  )
}

export default SelectableSafeRow
