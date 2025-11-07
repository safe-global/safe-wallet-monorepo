import { Card, Link, Stack, SvgIcon, Typography } from '@mui/material'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLinkIcon from '@/public/images/common/external-link.svg'
import css from './styles.module.css'
import type { ReactElement } from 'react'

export interface HnSecurityReportBtnProps {
  /**
   * The text to display in the banner
   */
  text: string
  /**
   * The href for the link. The banner will redirect to this URL when clicked.
   */
  href: string
}

const HnSecurityReportBtn = ({ text, href }: HnSecurityReportBtnProps): ReactElement => {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className={css.link} underline="none">
      <Card className={css.banner}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} className={css.content}>
          <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
          <Typography className={css.text}>{text}</Typography>
          <SvgIcon component={ExternalLinkIcon} inheritViewBox className={css.externalLinkIcon} />
        </Stack>
      </Card>
    </Link>
  )
}

export default HnSecurityReportBtn

