import { Info, WalletCards } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { PROPOSER_ROLE_DESCRIPTION, PROPOSER_ROLE_TITLE } from './constants'

const ProposerRoleHeader = () => (
  <div className="flex items-center gap-4">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-background-light-hover)]">
      <WalletCards className="size-4 text-badge-dot-success" aria-hidden />
    </div>

    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
        {PROPOSER_ROLE_TITLE}
        <ExternalLink
          href={HelpCenterArticle.PROPOSERS}
          noIcon
          aria-label="Learn more about proposers"
          className="flex text-muted-foreground no-underline hover:text-foreground"
        >
          <Info className="size-4 translate-y-px" aria-hidden />
        </ExternalLink>
      </span>

      <Typography variant="paragraph-small" color="muted" as="span" className="font-normal">
        {PROPOSER_ROLE_DESCRIPTION}
      </Typography>
    </div>
  </div>
)

export default ProposerRoleHeader
