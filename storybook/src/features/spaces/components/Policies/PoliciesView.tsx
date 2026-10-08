import type { ReactElement, ReactNode } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { PoliciesLoadError, PoliciesLoading } from './PoliciesLoadState'

/** Shown on the add policy dialog's options the plan does not include. */
export const LOCKED_POLICY_TOOLTIP = 'Upgrade to Business to set up policies.'

export type PoliciesViewProps = {
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  /** The plan upgrade banner, shown above the content when some policies are locked. */
  upsellBanner?: ReactNode
  /** The policies list or the catalogue, shown once the policies have loaded. */
  content: ReactNode
  /** Dialogs and detail panels. */
  children?: ReactNode
}

export const PoliciesView = ({
  isLoading,
  isError,
  onRetry,
  upsellBanner,
  content,
  children,
}: PoliciesViewProps): ReactElement => {
  const isSettled = !isLoading && !isError

  return (
    <div data-testid="policies">
      <div className="mb-6 flex flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Policies
        </Typography>

        {isSettled && (
          <Typography variant="paragraph-medium">
            Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
            automatically.{' '}
            <ExternalLink noIcon href={HelpCenterArticle.POLICIES}>
              Learn more
            </ExternalLink>
          </Typography>
        )}
      </div>

      {isLoading ? (
        <PoliciesLoading />
      ) : isError ? (
        <PoliciesLoadError onReload={onRetry} />
      ) : (
        <>
          {upsellBanner && <div className="mb-4">{upsellBanner}</div>}

          {content}
        </>
      )}

      {children}
    </div>
  )
}
