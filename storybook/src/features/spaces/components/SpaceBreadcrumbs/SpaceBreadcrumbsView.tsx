import type { ReactNode } from 'react'
import css from './styles.module.css'
import SpaceIcon from '@/public/images/spaces/space.svg'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type SpaceBreadcrumbsViewProps = {
  spaceId: string | null
  spaceName?: string
  showCurrentSafe: boolean
  renderCurrentSafe: (title: string) => ReactNode
}

export function SpaceBreadcrumbsView({
  spaceId,
  spaceName,
  showCurrentSafe,
  renderCurrentSafe,
}: SpaceBreadcrumbsViewProps) {
  return (
    <>
      <Track {...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE} label={SPACE_LABELS.space_breadcrumbs}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Workspaces"
          render={<Link href={{ pathname: AppRoutes.welcome.spaces }} />}
        >
          <SpaceIcon className="size-4 fill-none text-[var(--color-primary-main)]" />
        </Button>
      </Track>

      <Typography variant="paragraph-small">/</Typography>

      {spaceName !== undefined && (
        <Track {...SPACE_EVENTS.OPEN_SPACE_DASHBOARD} label={SPACE_LABELS.space_breadcrumbs}>
          <Link href={{ pathname: AppRoutes.spaces.index, query: { spaceId } }} className={css.spaceName}>
            <InitialsAvatar name={spaceName} size="xsmall" />
            <Typography variant="paragraph-small-bold">{spaceName}</Typography>
          </Link>
        </Track>
      )}

      <Typography variant="paragraph-small">/</Typography>

      {/* In case the nested breadcrumbs are not rendered we want to show the current safe address */}
      {showCurrentSafe && renderCurrentSafe('Current Safe')}
    </>
  )
}
