import { useState } from 'react'
import { ArrowUpRight, Check, Share2 } from 'lucide-react'
import { Drawer } from '@safe-global/views/components/common/Drawer/Drawer'
import { DrawerActions } from '@safe-global/views/components/common/Drawer/components/DrawerActions'
import { DrawerBody } from '@safe-global/views/components/common/Drawer/components/DrawerBody'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { DrawerList } from '@safe-global/views/components/common/Drawer/components/DrawerList'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import { useShareSafeAppUrl } from '@/components/safe-apps/hooks/useShareSafeAppUrl'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'
import { trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import type { AppRow } from '../catalogue'
import { APPS_V1_COPY } from '../copy'
import { AppIcon, NetworkLogos } from './AppParts'

const COPY = APPS_V1_COPY
const PREVIEW = APPS_V1_COPY.preview
const users = new Intl.NumberFormat('en-US')

const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const PreviewBody = ({ row, chainName }: { row: AppRow; chainName: (chainId: string) => string }) => {
  const app = row.app
  const links = app?.socialProfiles ?? []
  const details = [
    {
      label: PREVIEW.networks,
      content: (
        <span className="flex justify-end">
          <NetworkLogos chainIds={row.chainIds} chainName={chainName} />
        </span>
      ),
    },
    { label: PREVIEW.users, content: row.users ? users.format(row.users) : '—' },
    {
      label: PREVIEW.batch,
      content: app && isOptimizedForBatchTransactions(app) ? PREVIEW.supported : PREVIEW.notSupported,
    },
    ...(app?.developerWebsite
      ? [
          {
            label: PREVIEW.website,
            content: (
              <a href={app.developerWebsite} target="_blank" rel="noopener noreferrer" className="underline">
                {hostOf(app.developerWebsite)}
              </a>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6 pb-6" data-testid="app-preview">
      <Typography variant="paragraph-small" color="muted">
        {app?.description || row.does}
      </Typography>

      {app && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <Badge key={tag} variant="subtle">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <DrawerSection title={PREVIEW.details}>
        <DrawerList items={details} />
      </DrawerSection>

      {links.length > 0 && (
        <DrawerSection title={PREVIEW.links} collapsible defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Button
                key={link.platform}
                variant="outline"
                size="sm"
                render={<a href={link.url} target="_blank" rel="noopener noreferrer" />}
              >
                {link.platform.charAt(0) + link.platform.slice(1).toLowerCase()}
                <ArrowUpRight />
              </Button>
            ))}
          </div>
        </DrawerSection>
      )}
    </div>
  )
}

const useShareAction = (row: AppRow) => {
  const shareUrl = useShareSafeAppUrl(row.app?.url ?? '')
  const [copied, setCopied] = useState(false)
  return {
    label: copied ? PREVIEW.copied : PREVIEW.share,
    icon: copied ? <Check /> : <Share2 />,
    onClick: () => {
      void navigator.clipboard?.writeText(shareUrl)
      trackSafeAppEvent(SAFE_APPS_EVENTS.COPY_SHARE_URL, row.custom ? row.app?.url : row.name)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    },
  }
}

const PreviewHeader = ({
  row,
  list,
  pinned,
  onTogglePin,
  onNavigate,
}: {
  row: AppRow
  list: AppRow[]
  pinned: boolean
  onTogglePin: () => void
  onNavigate: (row: AppRow) => void
}) => {
  const share = useShareAction(row)
  const index = list.findIndex((item) => item.id === row.id)
  const actions = [
    ...(row.custom
      ? []
      : [
          {
            label: pinned ? COPY.unpin(row.name) : COPY.pin(row.name),
            icon: pinned ? <BookmarkedIcon className="fill-current" /> : <BookmarkIcon />,
            onClick: onTogglePin,
            pressed: pinned,
          },
        ]),
    share,
  ]

  return (
    <DrawerHeader
      media={<AppIcon row={row} size={40} />}
      title={row.name}
      subtitle={row.custom ? PREVIEW.custom : COPY.jobs[row.job]}
      actions={actions}
      navigation={{
        onPrevious: () => onNavigate(list[index - 1]),
        onNext: () => onNavigate(list[index + 1]),
        hasPrevious: index > 0,
        hasNext: index >= 0 && index < list.length - 1,
        position: index >= 0 ? `${index + 1} of ${list.length}` : undefined,
      }}
    />
  )
}

/** DES-201 prototype: a Safe App's preview on the shared Drawer, with Open Safe App in the footer. */
export const AppPreviewDrawer = ({
  row,
  list,
  isPinned,
  onTogglePin,
  onNavigate,
  onOpen,
  onClose,
  chainName,
}: {
  row: AppRow | null
  list: AppRow[]
  isPinned: (row: AppRow) => boolean
  onTogglePin: (row: AppRow) => void
  onNavigate: (row: AppRow) => void
  onOpen: (row: AppRow) => void
  onClose: () => void
  chainName: (chainId: string) => string
}) => (
  <Drawer open={row !== null} onClose={onClose} ariaLabel={row?.name} resizable expandable>
    {row && (
      <>
        <PreviewHeader
          row={row}
          list={list}
          pinned={isPinned(row)}
          onTogglePin={() => onTogglePin(row)}
          onNavigate={onNavigate}
        />
        <DrawerBody>
          <PreviewBody row={row} chainName={chainName} />
        </DrawerBody>
        <DrawerFooter hint={PREVIEW.openHint}>
          <DrawerActions
            primary={
              <Button size="lg" onClick={() => onOpen(row)} data-testid="preview-open-app">
                {COPY.openApp}
                <ArrowUpRight />
              </Button>
            }
          />
        </DrawerFooter>
      </>
    )}
  </Drawer>
)
