import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'

import css from './styles.module.css'

export type HnSecurityReportBtnViewProps = {
  href: string
  onClick: () => void
}

export const HnSecurityReportBtnView = ({ href, onClick }: HnSecurityReportBtnViewProps): ReactElement => {
  const { text } = hnSecurityReportBtnConfig

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="secondary" className="w-full" onClick={onClick} render={<ExternalLink href={href} />}>
            <span className={css.hypernativeIcon}>
              <HypernativeIcon />
            </span>
            {text}
          </Button>
        }
      />
      <TooltipContent>Review security report on Hypernative</TooltipContent>
    </Tooltip>
  )
}
