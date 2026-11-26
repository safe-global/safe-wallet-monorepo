import type { ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { ALLOWLIST_NOTICE_DESCRIPTION, ALLOWLIST_NOTICE_LINK, ALLOWLIST_NOTICE_TITLE } from '../constants'

/** The chosen Safe has a recipient allowlist, which the spending limit has to follow too. */
const AllowlistNotice = (): ReactElement => (
  <Alert variant="info" data-testid="spending-limit-allowlist-notice">
    <AlertSeverityIcon variant="info" />
    <AlertTitle>{ALLOWLIST_NOTICE_TITLE}</AlertTitle>
    <AlertDescription>
      {ALLOWLIST_NOTICE_DESCRIPTION}{' '}
      <ExternalLink href={HelpCenterArticle.POLICIES}>{ALLOWLIST_NOTICE_LINK}</ExternalLink>
    </AlertDescription>
  </Alert>
)

export default AllowlistNotice
