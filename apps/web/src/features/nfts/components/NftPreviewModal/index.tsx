import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { nftPlatforms } from '../../config'
import useChainId from '@/hooks/useChainId'
import { NftPreviewModalView } from '@views/features/nfts/components/NftPreviewModal/NftPreviewModalView'

const NftPreviewModal = ({ nft, onClose }: { nft?: Collectible; onClose: () => void }) => {
  const chainId = useChainId()
  const linkTemplate = nftPlatforms[chainId]?.[0]
  const link = nft && linkTemplate ? { title: linkTemplate.title, url: linkTemplate.getUrl(nft) } : undefined

  return <NftPreviewModalView nft={nft} link={link} onClose={onClose} />
}

export default NftPreviewModal
