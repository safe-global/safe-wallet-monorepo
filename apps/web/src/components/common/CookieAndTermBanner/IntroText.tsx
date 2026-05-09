import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import ExternalLink from '../ExternalLink'
import { AppRoutes } from '@/config/routes'
import { styles } from './constants'

const IntroText = ({ lastUpdated }: { lastUpdated: string }): ReactElement => {
  return (
    <Typography variant="body2" sx={styles.introText}>
      By browsing this page, you accept our <ExternalLink href={AppRoutes.terms}>Terms & Conditions</ExternalLink> (last
      updated {lastUpdated}) and the use of necessary cookies. By clicking &quot;Accept all&quot; you additionally agree
      to the use of Beamer and Analytics cookies as listed below.{' '}
      <ExternalLink href={AppRoutes.cookie}>Cookie policy</ExternalLink>
    </Typography>
  )
}

export default IntroText
