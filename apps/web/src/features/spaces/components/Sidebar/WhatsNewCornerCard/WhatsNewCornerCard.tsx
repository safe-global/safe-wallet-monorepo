import type { ReactElement } from 'react'
import { X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { useWhatsNewUpdates } from '@/hooks/useWhatsNewUpdates'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { WhatsNewCornerCardPost } from '@/store/api/beamer'
import { WhatsNewThumbnail } from '@safe-global/views/features/spaces/components/WhatsNewThumbnail'
import { getCornerCardThumbnail } from './getCornerCardThumbnail'

const DISMISSED_POST_KEY = 'whatsNewDismissedCornerCard'

export const WhatsNewCornerCardContent = ({
  cornerCard,
  onOpen,
  onClose,
}: {
  cornerCard: WhatsNewCornerCardPost
  onOpen: () => void
  onClose: () => void
}): ReactElement => (
  <Card
    size="none"
    bordered
    elevated
    data-testid="whats-new-corner-card"
    className="fixed bottom-24 left-4 z-[var(--z-sidebar)] w-[22rem] flex-row"
  >
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 cursor-pointer text-left">
      <WhatsNewThumbnail variant={getCornerCardThumbnail(cornerCard.category)} className="w-32 shrink-0" />
      <span className="flex min-w-0 flex-col gap-1 p-4 pr-8">
        <span className="font-semibold">{cornerCard.title}</span>
        {cornerCard.body && <span className="line-clamp-3 text-muted-foreground">{cornerCard.body}</span>}
      </span>
    </button>
    <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={onClose} className="absolute top-2 right-2">
      <X />
    </Button>
  </Card>
)

export const WhatsNewCornerCard = ({ onOpen }: { onOpen: () => void }): ReactElement | null => {
  const { cornerCard } = useWhatsNewUpdates()
  const [dismissedPostId, setDismissedPostId] = useLocalStorage<number>(DISMISSED_POST_KEY)

  if (!cornerCard || cornerCard.postId === dismissedPostId) return null

  const dismiss = () => setDismissedPostId(cornerCard.postId)

  return (
    <WhatsNewCornerCardContent
      cornerCard={cornerCard}
      onOpen={() => {
        dismiss()
        onOpen()
      }}
      onClose={dismiss}
    />
  )
}
