import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { CircleCheckIcon } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'

export type ContractVersionViewProps = {
  safeLoaded: boolean
  version?: string | null
  isLatestVersion: boolean
  releaseUrl?: string
  renderMastercopyWarning: (props: { variant: 'settings' }) => ReactNode
}

export const ContractVersionView = ({
  safeLoaded,
  version,
  isLatestVersion,
  releaseUrl,
  renderMastercopyWarning,
}: ContractVersionViewProps) => {
  return (
    <>
      <Typography variant="h4" className="mb-2">
        Contract version
      </Typography>

      {/* as="div": the Skeleton renders a div, which is invalid inside the default <p> */}
      <Typography as="div" className="flex items-center">
        {safeLoaded ? (
          <>
            {version ?? 'Unsupported contract'}
            {isLatestVersion && (
              <>
                <CircleCheckIcon className="ml-2 mr-1 size-5 text-primary" /> Latest version
              </>
            )}
          </>
        ) : (
          <Skeleton className="h-5 w-[60px]" />
        )}
      </Typography>

      {safeLoaded && releaseUrl && (
        <Typography variant="paragraph-small" className="block mt-1">
          <ExternalLink href={releaseUrl}>View release</ExternalLink>
        </Typography>
      )}

      <div className="mt-4">{renderMastercopyWarning({ variant: 'settings' })}</div>
    </>
  )
}
