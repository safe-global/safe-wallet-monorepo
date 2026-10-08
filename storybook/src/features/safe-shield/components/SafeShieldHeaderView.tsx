import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

export type SafeShieldHeaderViewProps = {
  backgroundColor: string
  textColor: string
  hasError: boolean
  isLoadingVisible: boolean
  /** Set while nothing is amiss: "N of M checks passed" replaces the plain title. */
  checksPassed?: { passed: number; total: number }
  title?: string
}

export const SafeShieldHeaderView = ({
  backgroundColor,
  textColor,
  hasError,
  isLoadingVisible,
  checksPassed,
  title,
}: SafeShieldHeaderViewProps): ReactElement => {
  const okTitle = checksPassed ? `${checksPassed.passed} of ${checksPassed.total} checks passed` : title
  const label = hasError ? 'Checks unavailable' : isLoadingVisible ? 'Analyzing...' : (okTitle ?? 'Copilot')

  return (
    <div className="px-1 pt-1">
      <div data-testid="safe-shield-status" className="flex flex-row rounded-md px-4 py-2" style={{ backgroundColor }}>
        <Typography variant="paragraph-mini-bold" className="uppercase" style={{ color: textColor }}>
          {label}
        </Typography>
      </div>
    </div>
  )
}
