import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '../ExternalLink'
import { AppRoutes } from '@/config/routes'

const IntroText = ({ lastUpdated }: { lastUpdated: string }): ReactElement => {
  return (
    <Typography variant="paragraph-small" className="block mb-4">
      By browsing this page, you accept our{' '}
      <ExternalLink className="font-bold hover:text-muted-foreground" href={AppRoutes.terms}>
        Terms & Conditions
      </ExternalLink>{' '}
      (last updated {lastUpdated}) and the use of necessary cookies. By clicking &quot;Accept all&quot; you additionally
      agree to the use of Beamer and Analytics cookies as listed below.{' '}
      <ExternalLink className="font-bold hover:text-muted-foreground" href={AppRoutes.cookie}>
        Cookie policy
      </ExternalLink>
    </Typography>
  )
}

export default IntroText
