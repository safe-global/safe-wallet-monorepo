import { Card, Stack, SvgIcon, Typography } from '@mui/material'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'

interface HnSecurityReportBtnProps {
  chain: string
  safe: string
  tx: string
}

export const HnSecurityReportBtn = ({ chain, safe, tx }: HnSecurityReportBtnProps): ReactElement => {
  const { text, baseUrl } = hnSecurityReportBtnConfig

  const href = `${baseUrl}?chain=${encodeURIComponent(chain)}&safe=${encodeURIComponent(safe)}&tx=${encodeURIComponent(tx)}`

  return (
    <ExternalLink href={href} className={css.link}>
      <Card className={css.banner}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} className={css.content}>
          <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
          <Typography className={css.text}>{text}</Typography>
        </Stack>
      </Card>
    </ExternalLink>
  )
}

export default HnSecurityReportBtn
