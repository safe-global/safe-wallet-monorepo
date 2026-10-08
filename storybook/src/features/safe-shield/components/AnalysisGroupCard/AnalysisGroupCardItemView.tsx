import type { ReactNode } from 'react'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { AnalysisDetailsDropdown } from '@views/features/safe-shield/components/AnalysisDetailsDropdown'

export interface AnalysisGroupCardItemViewProps {
  borderColor: string
  description: ReactNode
  hasError: boolean
  error?: string
  issuesDisplay: ReactNode
  addressChanges?: ReactNode
  showAllAddress?: ReactNode
  showReportLink: boolean | string | undefined
  onReportClick: () => void
  reportModal?: ReactNode
}

export const AnalysisGroupCardItemView = ({
  borderColor,
  description,
  hasError,
  error,
  issuesDisplay,
  addressChanges,
  showAllAddress,
  showReportLink,
  onReportClick,
  reportModal,
}: AnalysisGroupCardItemViewProps) => {
  return (
    <>
      <div className="overflow-hidden rounded-[4px] bg-[var(--color-background-main)]">
        <div className="border-l-4 p-3" style={{ borderLeftColor: borderColor }}>
          <div className="flex flex-col gap-4">
            <Typography variant="paragraph-small" className="break-words text-[var(--color-primary-light)]">
              {description}
            </Typography>

            {hasError && (
              <AnalysisDetailsDropdown
                showLabel="Show details"
                hideLabel="Hide details"
                contentWrapper={(children) => (
                  <div className="mt-1 rounded-[4px] bg-[var(--color-background-paper)] px-2 py-1 break-words">
                    {children}
                  </div>
                )}
              >
                <Typography variant="paragraph-mini" className="leading-[14px] text-[var(--color-text-secondary)]">
                  {error}
                </Typography>
              </AnalysisDetailsDropdown>
            )}

            {issuesDisplay}

            {addressChanges}

            {showAllAddress}

            {showReportLink && (
              <Link
                variant="inherit"
                render={<button type="button" />}
                onClick={onReportClick}
                className="cursor-pointer text-left text-xs leading-4 font-normal text-[var(--color-text-secondary)] no-underline hover:no-underline"
              >
                Report false result
              </Link>
            )}
          </div>
        </div>
      </div>

      {reportModal}
    </>
  )
}
