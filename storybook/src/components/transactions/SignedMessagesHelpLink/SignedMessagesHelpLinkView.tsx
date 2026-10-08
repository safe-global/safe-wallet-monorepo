import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export const SignedMessagesHelpLinkView = () => {
  return (
    <div className="flex items-center gap-2">
      <InfoIcon className="size-4 text-[var(--color-border-main)]" />
      <ExternalLink noIcon href={HelpCenterArticle.SIGNED_MESSAGES}>
        <Typography variant="paragraph-small-bold">What are signed messages?</Typography>
      </ExternalLink>
    </div>
  )
}
