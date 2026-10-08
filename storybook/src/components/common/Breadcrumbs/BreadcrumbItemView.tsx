import type { ReactElement } from 'react'
import Link from 'next/link'
import type { UrlObject } from 'url'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import Identicon from '@/components/common/Identicon'
import css from './styles.module.css'

export type BreadcrumbItemViewProps = {
  title: string
  address: string
  name: string
  href?: UrlObject
}

export const BreadcrumbItemView = ({ title, address, name, href }: BreadcrumbItemViewProps): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <div className={css.breadcrumb} aria-label={title}>
          <Identicon address={address} size={20} />
          {href ? (
            <Link href={href}>
              <Typography variant="paragraph-small" className="text-muted-foreground">
                {name}
              </Typography>
            </Link>
          ) : (
            <Typography variant="paragraph-small">{name}</Typography>
          )}
        </div>
      }
    />
    <TooltipContent>{title}</TooltipContent>
  </Tooltip>
)
