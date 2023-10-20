import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Typography } from '@mui/material'
import type { SessionTypes } from '@walletconnect/types'
import type { ReactElement } from 'react'

import css from './styles.module.css'

type WcSesstionListProps = {
  sessions: SessionTypes.Struct[]
  onDisconnect: (session: SessionTypes.Struct) => void
}

const WcSessionListItem = ({
  session,
  onDisconnect,
}: {
  session: SessionTypes.Struct
  onDisconnect: () => void
}): ReactElement => {
  const { safeLoaded } = useSafeInfo()

  return (
    <ListItem className={css.sessionListItem}>
      {session.peer.metadata.icons[0] && (
        <ListItemAvatar className={css.sessionListAvatar}>
          <SafeAppIconCard src={session.peer.metadata.icons[0]} alt="icon" width={20} height={20} />
        </ListItemAvatar>
      )}
      <ListItemText
        primary={session.peer.metadata.name}
        primaryTypographyProps={{ color: safeLoaded ? undefined : 'text.secondary' }}
      />
      <ListItemIcon className={css.sessionListSecondaryAction}>
        <Button variant="danger" onClick={onDisconnect} className={css.button}>
          Disconnect
        </Button>
      </ListItemIcon>
    </ListItem>
  )
}

const WcSessionList = ({ sessions, onDisconnect }: WcSesstionListProps): ReactElement => {
  if (sessions.length === 0) {
    return (
      <Typography variant="body2" textAlign="center" color="text.secondary">
        No dApps are connected yet
      </Typography>
    )
  }

  return (
    <List className={css.sessionList}>
      {Object.values(sessions).map((session) => (
        <WcSessionListItem key={session.topic} session={session} onDisconnect={() => onDisconnect(session)} />
      ))}
    </List>
  )
}

export default WcSessionList
