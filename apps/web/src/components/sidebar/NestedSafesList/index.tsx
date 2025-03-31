import Link from 'next/link'
import { ChevronRight } from '@mui/icons-material'
import { List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material'

import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useState, type ReactElement } from 'react'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useAddressBook from '@/hooks/useAddressBook'
import { trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'

const MAX_NESTED_SAFES = 5

export function NestedSafesList({
  onClose,
  nestedSafes,
}: {
  onClose: () => void
  nestedSafes: Array<string>
}): ReactElement {
  const [showAll, setShowAll] = useState(false)
  const nestedSafesToShow = showAll ? nestedSafes : nestedSafes.slice(0, MAX_NESTED_SAFES)

  const onShowAll = () => {
    setShowAll(true)
  }

  return (
    <List sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {nestedSafesToShow.map((nestedSafe) => {
        return <NestedSafeListItem onClose={onClose} nestedSafe={nestedSafe} key={nestedSafe} />
      })}
      {nestedSafes.length > MAX_NESTED_SAFES && !showAll && (
        <Track {...NESTED_SAFE_EVENTS.SHOW_ALL}>
          <Typography
            variant="caption"
            color="text.secondary"
            textTransform="uppercase"
            fontWeight={700}
            sx={{ cursor: 'pointer' }}
            onClick={onShowAll}
          >
            Show all Nested Safes
            <ChevronRight color="border" sx={{ transform: 'rotate(90deg)', ml: 1 }} fontSize="inherit" />
          </Typography>
        </Track>
      )}
    </List>
  )
}

function NestedSafeListItem({ onClose, nestedSafe }: { onClose: () => void; nestedSafe: string }): ReactElement {
  const chain = useCurrentChain()
  const addressBook = useAddressBook()
  const name = addressBook[nestedSafe]

  const onClick = () => {
    // Note: using the Track element breaks accessibility/styles
    trackEvent({ ...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE, label: NESTED_SAFE_LABELS.list })

    onClose()
  }

  return (
    <ListItem
      sx={{
        border: ({ palette }) => `1px solid ${palette.border.light}`,
        borderRadius: ({ shape }) => `${shape.borderRadius}px`,
        p: 0,
      }}
    >
      <Link
        href={{
          pathname: AppRoutes.home,
          query: {
            safe: `${chain?.shortName}:${nestedSafe}`,
          },
        }}
        passHref
        legacyBehavior
      >
        <ListItemButton sx={{ p: '11px 12px' }} onClick={onClick}>
          <ListItemAvatar sx={{ minWidth: 'unset', pr: 1 }}>
            <Identicon address={nestedSafe} size={32} />
          </ListItemAvatar>
          <ListItemText
            primary={name}
            primaryTypographyProps={{
              fontWeight: 700,
              sx: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
            secondary={shortenAddress(nestedSafe)}
            secondaryTypographyProps={{ color: 'primary.light' }}
            sx={{ my: 0 }}
          />
          <ChevronRight color="border" />
        </ListItemButton>
      </Link>
    </ListItem>
  )
}
