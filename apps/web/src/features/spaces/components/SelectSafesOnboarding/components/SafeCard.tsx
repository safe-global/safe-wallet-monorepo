import { Controller, useFormContext } from 'react-hook-form'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import useSafeCardData from '../hooks/useSafeCardData'
import SafeAvatar from './SafeAvatar'
import FiatBalance from './FiatBalance'
import ThresholdBadge from './ThresholdBadge'

const getSafeId = (safeItem: SafeItem) => `${safeItem.chainId}:${safeItem.address}`
const getMultiChainSafeId = (mcSafe: MultiChainSafeItem) => `multichain_${mcSafe.address}`

interface SafeCardProps {
  safe: SafeItem | MultiChainSafeItem
  alreadyAdded: boolean
}

const SafeCard = ({ safe, alreadyAdded }: SafeCardProps) => {
  const isMultiChain = isMultiChainSafeItem(safe)
  const { setValue, watch, control } = useFormContext<AddAccountsFormValues>()
  const { name, fiatValue, threshold, ownersCount, elementRef } = useSafeCardData(safe)
  const safes = isMultiChain ? (safe as MultiChainSafeItem).safes : [safe as SafeItem]

  const subSafeIds = isMultiChain ? (safe as MultiChainSafeItem).safes.map(getSafeId) : []
  const safeId = isMultiChain ? getMultiChainSafeId(safe as MultiChainSafeItem) : getSafeId(safe as SafeItem)

  const watchedSubSafeIds = subSafeIds.map((id) => `selectedSafes.${id}` as const)
  // @ts-ignore TODO: Check why this overload is not supported
  const subSafeValues: boolean[] = isMultiChain ? watch(watchedSubSafeIds) : []
  const allSubSafesChecked = subSafeValues.every(Boolean) && subSafeValues.length > 0

  const handleMultiChainToggle = () => {
    if (alreadyAdded) return
    const newValue = !allSubSafesChecked
    setValue(`selectedSafes.${safeId}`, newValue, { shouldValidate: true })
    subSafeIds.forEach((id) => {
      setValue(`selectedSafes.${id}`, newValue, { shouldValidate: true })
    })
  }

  if (isMultiChain) {
    return (
      <SafeCardLayout
        ref={elementRef as React.Ref<HTMLButtonElement>}
        alreadyAdded={alreadyAdded}
        checked={allSubSafesChecked || alreadyAdded}
        onToggle={handleMultiChainToggle}
        name={name}
        address={safe.address}
        safes={safes}
        fiatValue={fiatValue}
        threshold={threshold}
        ownersCount={ownersCount}
      />
    )
  }

  return (
    <Controller
      name={`selectedSafes.${safeId}`}
      control={control}
      render={({ field }) => (
        <SafeCardLayout
          ref={elementRef as React.Ref<HTMLButtonElement>}
          alreadyAdded={alreadyAdded}
          checked={Boolean(field.value) || alreadyAdded}
          onToggle={() => !alreadyAdded && field.onChange(!field.value)}
          onCheckedChange={(checked) => field.onChange(checked)}
          name={name}
          address={safe.address}
          safes={safes}
          fiatValue={fiatValue}
          threshold={threshold}
          ownersCount={ownersCount}
        />
      )}
    />
  )
}

interface SafeCardLayoutProps {
  ref?: React.Ref<HTMLButtonElement>
  alreadyAdded: boolean
  checked: boolean
  onToggle: () => void
  onCheckedChange?: (checked: boolean) => void
  name: string | undefined
  address: string
  safes: SafeItem[]
  fiatValue: string | number | undefined
  threshold: number
  ownersCount: number
}

const SafeCardLayout = ({
  ref,
  alreadyAdded,
  checked,
  onToggle,
  onCheckedChange,
  name,
  address,
  safes,
  fiatValue,
  threshold,
  ownersCount,
}: SafeCardLayoutProps) => (
  <button
    ref={ref}
    type="button"
    onClick={onToggle}
    disabled={alreadyAdded}
    className="flex w-full cursor-pointer items-center gap-2 rounded-3xl bg-card py-4 pl-2 pr-6 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
  >
    <div className="flex shrink-0 items-center px-2">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange ?? (() => onToggle())}
        onClick={(e) => e.stopPropagation()}
        disabled={alreadyAdded}
      />
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-4">
      <SafeAvatar name={name} address={address} />

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-base font-medium text-foreground">{name || shortenAddress(address)}</span>
        <span className="text-xs text-muted-foreground">{shortenAddress(address)}</span>
      </div>
    </div>

    <AccountItem.ChainBadge safes={safes} />

    <div className="flex shrink-0 flex-col min-w-16 items-end gap-2">
      <FiatBalance value={fiatValue} />
      {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
    </div>
  </button>
)

export { getSafeId, getMultiChainSafeId }
export default SafeCard
