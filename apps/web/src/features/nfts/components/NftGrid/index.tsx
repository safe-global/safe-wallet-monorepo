import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { useCallback } from 'react'
import { type ReactElement } from 'react'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import useChainId from '@/hooks/useChainId'
import { nftPlatforms } from '../../config'
import { NftGridView } from '@views/features/nfts/components/NftGrid/NftGridView'

interface NftsTableProps {
  nfts: Collectible[]
  selectedNfts: Collectible[]
  setSelectedNfts: Dispatch<SetStateAction<Collectible[]>>
  isLoading: boolean
  children?: ReactNode
  onPreview: (item: Collectible) => void
}

const getNftKey = (nft: Collectible) => `${nft.address}-${nft.id}`

const NftGrid = ({
  nfts,
  selectedNfts,
  setSelectedNfts,
  isLoading,
  children,
  onPreview,
}: NftsTableProps): ReactElement => {
  const chainId = useChainId()
  const linkTemplates = nftPlatforms[chainId] || []
  // Filter string
  const [filter, setFilter] = useState<string>('')

  const selectedKeySignature = useMemo(() => {
    if (!selectedNfts.length) {
      return ''
    }

    return selectedNfts.map(getNftKey).sort().join('|')
  }, [selectedNfts])

  const selectedKeys = useMemo(() => {
    if (!selectedKeySignature) {
      return new Set<string>()
    }

    return new Set(selectedKeySignature.split('|'))
  }, [selectedKeySignature])

  const onFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value.toLowerCase())
    },
    [setFilter],
  )

  const onCheckboxClick = useCallback(
    (checked: boolean, item: Collectible) => {
      const key = getNftKey(item)
      setSelectedNfts((prev) => {
        if (checked) {
          if (selectedKeys.has(key)) {
            return prev
          }

          return prev.concat(item)
        }

        return prev.filter((el) => getNftKey(el) !== key)
      })
    },
    [selectedKeys, setSelectedNfts],
  )

  // Filter by collection name or token address
  const filteredNfts = useMemo(() => {
    return filter
      ? nfts.filter((nft) => nft.tokenName.toLowerCase().includes(filter) || nft.address.toLowerCase().includes(filter))
      : nfts
  }, [nfts, filter])

  const onSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedNfts(checked ? filteredNfts : [])
    },
    [filteredNfts, setSelectedNfts],
  )

  return (
    <NftGridView
      nftsCount={nfts.length}
      filteredNfts={filteredNfts}
      isFiltering={!!filter}
      getLinks={(item) => linkTemplates.map(({ title, logo, getUrl }) => ({ title, logo, href: getUrl(item) }))}
      allSelected={filteredNfts.length > 0 && filteredNfts.length === selectedNfts.length}
      isSelected={(item) => selectedKeys.has(getNftKey(item))}
      isLoading={isLoading}
      onFilterChange={onFilterChange}
      onSelectAll={onSelectAll}
      onCheckboxClick={onCheckboxClick}
      onPreview={onPreview}
    >
      {children}
    </NftGridView>
  )
}

export default NftGrid
