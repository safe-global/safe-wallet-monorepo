import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { List, ListItem } from '@/components/ui/list'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'
import css from './styles.module.css'

const MAX_NAME_LENGTH = 23

export type WcSessionListItemViewProps = {
  peerName?: string
  icon?: string
  safeLoaded: boolean
  isLoading: boolean
  isDisconnecting: boolean
  onDisconnect: () => void
}

export const WcSessionListItemView = ({
  peerName,
  icon,
  safeLoaded,
  isLoading,
  isDisconnecting,
  onDisconnect,
}: WcSessionListItemViewProps) => {
  let name = peerName || 'Unknown dApp'

  if (name.length > MAX_NAME_LENGTH + 1) {
    name = `${name.slice(0, MAX_NAME_LENGTH)}…`
  }

  return (
    <ListItem className={`px-4 ${css.sessionListItem}`}>
      {icon && (
        <div className={`flex pr-1 ${css.sessionListAvatar}`}>
          <SafeAppIconCard src={icon} alt="icon" width={20} height={20} />
        </div>
      )}

      <span className={cn('flex-1 truncate text-sm', safeLoaded ? 'text-foreground' : 'text-muted-foreground')}>
        {name}
      </span>

      <div className={css.sessionListSecondaryAction}>
        <Button
          variant="destructive"
          onClick={onDisconnect}
          // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
          className="py-[var(--space-1)] px-[var(--space-2)]"
          disabled={isLoading}
        >
          {isDisconnecting ? <Spinner className="size-5" /> : 'Disconnect'}
        </Button>
      </div>
    </ListItem>
  )
}

export type WcSessionListViewProps = {
  children: ReactNode
}

export const WcSessionListView = ({ children }: WcSessionListViewProps) => {
  return <List className={css.sessionList}>{children}</List>
}
