import { Button, SvgIcon, Tooltip } from '@mui/material'
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

const buildSecurityReportUrl = (baseUrl: string, chain: string, safe: string, tx: string): string => {
  const url = new URL(baseUrl)
  url.searchParams.set('chain', chain)
  url.searchParams.set('safe', safe)
  url.searchParams.set('tx', tx)
  return url.toString()
}

export const HnSecurityReportBtn = ({ chain, safe, tx }: HnSecurityReportBtnProps): ReactElement => {
  const { text, baseUrl } = hnSecurityReportBtnConfig

  const href = buildSecurityReportUrl(baseUrl, chain, safe, tx)

  return (
    <Tooltip title="Review security report on Hypernative" arrow placement="top">
      <Button variant="outlined" fullWidth className={css.button} component={ExternalLink} href={href}>
        <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
        {text}
      </Button>
    </Tooltip>
  )
}

export default HnSecurityReportBtn
