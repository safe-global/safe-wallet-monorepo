import { Card, Stack, SvgIcon, Typography } from '@mui/material'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'

export const HnSecurityReportBtn = (): ReactElement => {
  const { text, href } = hnSecurityReportBtnConfig

  return (
    <Card className={css.banner}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} className={css.content}>
        <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
        <Typography className={css.text}>{text}</Typography>
        <ExternalLink href={typeof href === 'string' ? href : href.href || '#'} className={css.link} noIcon>
        </ExternalLink>
      </Stack>
    </Card>
  )
}

export default HnSecurityReportBtn
