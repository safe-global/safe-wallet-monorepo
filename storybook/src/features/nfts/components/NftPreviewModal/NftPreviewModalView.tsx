import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import ModalDialog from '@/components/common/ModalDialog'
import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { Spinner } from '@/components/ui/spinner'

export type NftPreviewModalViewProps = {
  nft?: Collectible
  link?: { title: string; url: string }
  onClose: () => void
}

export const NftPreviewModalView = ({ nft, link, onClose }: NftPreviewModalViewProps) => {
  const title = nft ? nft.name || `${nft.tokenSymbol} #${nft.id.slice(0, 20)}` : ''

  return (
    <ModalDialog
      open={!!nft?.imageUri}
      onClose={onClose}
      dialogTitle={title}
      fullScreen
      sx={{ margin: [0, 2], '.MuiPaper-root': { borderRadius: [0, '6px'] } }}
    >
      {nft && (
        <div className={css.wrapper}>
          <div className={css.imageWrapper} onClick={onClose}>
            <img src={nft.imageUri ?? undefined} alt={nft.name ?? undefined} />

            <Spinner className={`${css.loader} size-10`} />
          </div>

          {link && <ExternalLink href={link.url}>View on {link.title}</ExternalLink>}
        </div>
      )}
    </ModalDialog>
  )
}
