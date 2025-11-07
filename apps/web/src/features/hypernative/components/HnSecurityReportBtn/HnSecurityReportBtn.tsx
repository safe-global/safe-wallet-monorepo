import { Card, Stack, SvgIcon, Typography } from '@mui/material'
import NextLink from 'next/link'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLinkIcon from '@/public/images/common/external-link.svg'
import css from './styles.module.css'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'

export const HnSecurityReportBtn = (): ReactElement => {
  const { text, href } = hnSecurityReportBtnConfig

  return (
    <NextLink href={href} target="_blank" rel="noopener noreferrer" className={css.link}>
      <Card className={css.banner}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} className={css.content}>
          <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
          <Typography className={css.text}>{text}</Typography>
          <SvgIcon component={ExternalLinkIcon} inheritViewBox className={css.externalLinkIcon} />
        </Stack>
      </Card>
    </NextLink>
  )
}

export default HnSecurityReportBtn
