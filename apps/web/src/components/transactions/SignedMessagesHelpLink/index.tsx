import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useSafeMessages from '@/hooks/messages/useSafeMessages'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const SignedMessagesHelpLink = () => {
  const { page } = useSafeMessages()
  const safeMessagesCount = page?.results.length ?? 0

  if (safeMessagesCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <InfoIcon className="size-4 text-[var(--color-border-main)]" />
      <ExternalLink noIcon href={HelpCenterArticle.SIGNED_MESSAGES}>
        <Typography variant="paragraph-small-bold">What are signed messages?</Typography>
      </ExternalLink>
    </div>
  )
}

export default SignedMessagesHelpLink
