import React from 'react'
import { TriangleAlert, X } from 'lucide-react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ExternalLink from '@/components/common/ExternalLink'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

type ThirdPartyCookiesWarningProps = {
  onClose: () => void
}

export const ThirdPartyCookiesWarning = ({ onClose }: ThirdPartyCookiesWarningProps): React.ReactElement => {
  return (
    <Alert variant="warning" className="rounded-none border-0 border-b border-[var(--color-warning-main)]">
      <TriangleAlert />
      <AlertTitle>
        Third party cookies are disabled. Safe Apps may therefore not work properly. You can find out more information
        about this <ExternalLink href={HelpCenterArticle.COOKIES}>here</ExternalLink>
      </AlertTitle>
      <AlertAction>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </AlertAction>
    </Alert>
  )
}
