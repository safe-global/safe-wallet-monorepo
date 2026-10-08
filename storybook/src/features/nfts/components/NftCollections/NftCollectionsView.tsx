import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NftIcon from '@/public/images/common/nft.svg'

export type NftCollectionsViewProps = {
  isEmpty: boolean
  hasError: boolean
  renderErrorMessage: (message: string) => ReactNode
  onSendSubmit: (e: SyntheticEvent) => void
  sendForm: ReactNode
  grid: ReactNode
  previewModal: ReactNode
}

export const NftCollectionsView = ({
  isEmpty,
  hasError,
  renderErrorMessage,
  onSendSubmit,
  sendForm,
  grid,
  previewModal,
}: NftCollectionsViewProps): ReactElement => {
  // No NFTs to display
  if (isEmpty) {
    return <PagePlaceholder img={<NftIcon />} text="No NFTs available or none detected" />
  }

  return (
    <>
      {hasError ? (
        /* Loading error */
        renderErrorMessage('Failed to load NFTs')
      ) : (
        /* NFTs */
        <form onSubmit={onSendSubmit}>
          {/* Batch send form */}
          {sendForm}

          {/* NFTs table */}
          {grid}
        </form>
      )}

      {/* NFT preview */}
      {previewModal}
    </>
  )
}
