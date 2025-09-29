import { type SyntheticEvent, type ReactElement, useCallback, useEffect, useMemo, useState, useContext } from 'react'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import ErrorMessage from '@/components/tx/ErrorMessage'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NftIcon from '@/public/images/common/nft.svg'
import useCollectibles from '@/hooks/useCollectibles'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import { NFT_EVENTS } from '@/services/analytics/events/nfts'
import { trackEvent } from '@/services/analytics'
import NftGrid from '../NftGrid'
import NftSendForm from '../NftSendForm'
import NftPreviewModal from '../NftPreviewModal'
import { TxModalContext } from '@/components/tx-flow'
import { NftTransferFlow } from '@/components/tx-flow/flows'

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

  // No NFTs to display
  if (!isInitialLoading && nfts.length === 0) {
    return <PagePlaceholder img={<NftIcon />} text="No NFTs available or none detected" />
  }

  return (
    <>
      {error ? (
        /* Loading error */
        <ErrorMessage error={error}>Failed to load NFTs</ErrorMessage>
      ) : (
        /* NFTs */
        <form onSubmit={onSendSubmit}>
          {/* Batch send form */}
          <NftSendForm selectedNfts={selectedNfts} />

          {/* NFTs table */}
          <NftGrid
            nfts={nfts}
            selectedNfts={selectedNfts}
            setSelectedNfts={setSelectedNfts}
            onPreview={onPreview}
            isLoading={isInitialLoading || isFetchingNextPage}
          >
            {/* Infinite scroll at the bottom of the table */}
            {hasNextPage ? <InfiniteScroll onLoadMore={loadMore} /> : null}
          </NftGrid>
        </form>
      )}

      {/* NFT preview */}
      <NftPreviewModal onClose={() => setPreviewNft(undefined)} nft={previewNft} />
    </>
  )
}

export default NftCollections
