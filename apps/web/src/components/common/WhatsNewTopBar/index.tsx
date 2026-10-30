import type { ReactElement } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { useBeamerUpdates } from '@/hooks/useBeamerUpdates'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { BeamerTopBar } from '@/store/api/beamer'

const DISMISSED_POST_KEY = 'beamerDismissedTopBar'

export const WhatsNewTopBarContent = ({
  topBar,
  onClose,
}: {
  topBar: BeamerTopBar
  onClose: () => void
}): ReactElement => (
  <div
    role="status"
    data-testid="whats-new-top-bar"
    className="fixed inset-x-0 top-0 z-[var(--z-sidebar)] flex min-h-12 items-center justify-center gap-3 bg-mint px-12 py-2 text-sm text-accent-secondary-foreground"
  >
    {topBar.category && (
      <Badge variant="card" shape="tag">
        {topBar.category}
      </Badge>
    )}
    <span>{topBar.title}</span>
    {topBar.link && (
      <Button
        size="sm"
        variant="secondary"
        render={<a href={topBar.link.url} target="_blank" rel="noopener noreferrer" />}
      >
        {topBar.link.text}
      </Button>
    )}
    <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose} className="absolute right-2">
      <X />
    </Button>
  </div>
)

const WhatsNewTopBar = (): ReactElement | null => {
  const { topBar } = useBeamerUpdates()
  const [dismissedPostId, setDismissedPostId] = useLocalStorage<number>(DISMISSED_POST_KEY)

  if (!topBar || topBar.postId === dismissedPostId) return null

  return <WhatsNewTopBarContent topBar={topBar} onClose={() => setDismissedPostId(topBar.postId)} />
}

export default WhatsNewTopBar
