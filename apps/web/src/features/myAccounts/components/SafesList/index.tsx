import { type AllSafeItems, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { SafesList as CommonSafesList } from '@/components/common/SafeList'
import { SafeCardItem } from '@/components/common/SafeList/components'

export type SafeListProps = {
  safes?: AllSafeItems
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SafesList = ({ safes, onLinkClick, isSpaceSafe }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return (
    <CommonSafesList
      trustedSafes={[]}
      ownedSafes={safes}
      similarAddresses={new Set()}
      renderSafeCard={(safe: SafeItem | MultiChainSafeItem, isSimilar: boolean) => (
        <SafeCardItem safe={safe} isSimilar={isSimilar} />
      )}
    />
  )
}

export default SafesList
