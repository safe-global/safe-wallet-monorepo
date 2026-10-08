import { type SyntheticEvent, type ReactElement, useCallback, useEffect, useMemo, useState, useContext } from 'react'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useCollectibles from '@/hooks/useCollectibles'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import { NFT_EVENTS } from '@/services/analytics/events/nfts'
import { trackEvent } from '@/services/analytics'
import NftGrid from '../NftGrid'
import NftSendForm from '../NftSendForm'
import NftPreviewModal from '../NftPreviewModal'
import { TxModalContext } from '@/components/tx-flow'
import { NftTransferFlow } from '@/components/tx-flow/flows'
import { NftCollectionsView } from '@views/features/nfts/components/NftCollections/NftCollectionsView'

const NftCollections = (): ReactElement => {
  const { nfts, error, isInitialLoading, isFetchingNextPage, hasNextPage, loadMore } = useCollectibles()
  const [selectedNfts, setSelectedNfts] = useState<Collectible[]>([])
  const [previewNft, setPreviewNft] = useState<Collectible>()
  // Tx modal
  const { setTxFlow } = useContext(TxModalContext)

  // On NFT preview click
  const onPreview = useCallback((token: Collectible) => {
    setPreviewNft(token)
    trackEvent(NFT_EVENTS.PREVIEW)
  }, [])

  const onSendSubmit = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()

      if (selectedNfts.length) {
        // Show the NFT transfer modal
        setTxFlow(<NftTransferFlow tokens={selectedNfts} />)

        // Track how many NFTs are being sent
        trackEvent({ ...NFT_EVENTS.SEND, label: selectedNfts.length })
      }
    },
    [selectedNfts, setTxFlow],
  )

  const nftKeys = useMemo(() => new Set(nfts.map((item) => `${item.address}-${item.id}`)), [nfts])

  useEffect(() => {
    setSelectedNfts((prevSelected) => prevSelected.filter((item) => nftKeys.has(`${item.address}-${item.id}`)))
  }, [nftKeys])

  return (
    <NftCollectionsView
      isEmpty={!isInitialLoading && nfts.length === 0}
      hasError={!!error}
      renderErrorMessage={(message) => <ErrorMessage error={error}>{message}</ErrorMessage>}
      onSendSubmit={onSendSubmit}
      sendForm={<NftSendForm selectedNfts={selectedNfts} />}
      grid={
        <NftGrid
          nfts={nfts}
          selectedNfts={selectedNfts}
          setSelectedNfts={setSelectedNfts}
          onPreview={onPreview}
          isLoading={isInitialLoading || isFetchingNextPage}
        >
          {hasNextPage ? <InfiniteScroll onLoadMore={loadMore} /> : null}
        </NftGrid>
      }
      previewModal={<NftPreviewModal onClose={() => setPreviewNft(undefined)} nft={previewNft} />}
    />
  )
}

export default NftCollections
