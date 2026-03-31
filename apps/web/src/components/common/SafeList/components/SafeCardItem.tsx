import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import useSafeCardData from './hooks/useSafeCardData'
import { SafeCardLayout } from './SafeCardLayout'
import MultiAccountContextMenu from '@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu'

export interface SafeCardItemProps {
  safe: SafeItem | MultiChainSafeItem
  isSimilar?: boolean
}

const SafeCardItem = ({ safe, isSimilar }: SafeCardItemProps) => {
  const isMultiChain = isMultiChainSafeItem(safe)
  const { name, fiatValue, threshold, ownersCount, chainIds, elementRef } = useSafeCardData(safe)
  const safes = isMultiChain ? (safe as MultiChainSafeItem).safes : [safe as SafeItem]

  return (
    <div className="relative">
      <SafeCardLayout
        ref={elementRef as React.Ref<HTMLButtonElement>}
        checked={false}
        onToggle={() => {}}
        name={name}
        address={safe.address}
        safes={safes}
        fiatValue={fiatValue}
        threshold={threshold}
        ownersCount={ownersCount}
        isSimilar={isSimilar}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <MultiAccountContextMenu name={name || ''} address={safe.address} chainIds={chainIds || []} addNetwork />
      </div>
    </div>
  )
}

export default SafeCardItem
