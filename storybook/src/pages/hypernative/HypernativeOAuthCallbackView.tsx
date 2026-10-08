import { Typography } from '@/components/ui/typography'
import { GradientCircularProgress } from '@/components/common/GradientCircularProgress'
import InfoIcon from '@/public/images/notifications/info.svg'
import CheckIcon from '@/public/images/common/check.svg'

export type HypernativeOAuthCallbackViewProps = {
  status: 'loading' | 'success' | 'error'
  errorMessage: string
  isDarkMode: boolean
}

export const HypernativeOAuthCallbackView = ({
  status,
  errorMessage,
  isDarkMode,
}: HypernativeOAuthCallbackViewProps) => {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ marginTop: 'calc(-1 * var(--header-height))' }} // subtract header height to center content in the viewport
    >
      <div className="bg-card flex w-full max-w-[433px] flex-col items-center rounded-lg p-8 text-center sm:w-[433px]">
        {status === 'loading' && (
          <>
            <GradientCircularProgress size={40} thickness={5} />
            <Typography variant="h3" className="mt-6 font-bold">
              Authentication in progress
            </Typography>
            <Typography variant="paragraph-small" color="muted" className="block mt-2">
              Hypernative authentication is in progress. Don’t close this window.
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="size-10 rounded-full bg-[var(--color-success-background)] p-2">
              <CheckIcon className="size-5 text-[var(--color-success-main)]" />
            </div>
            <Typography variant="h3" className="mt-6 font-bold">
              Login successful
            </Typography>
            <Typography variant="paragraph-small" color="muted" className="block mt-2">
              You’re now signed in to Hypernative.
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="size-10 rounded-full p-2"
              style={{
                backgroundColor: isDarkMode ? 'var(--color-info-background)' : 'var(--color-info-light)',
              }}
            >
              <InfoIcon className="size-5 text-[var(--color-info-main)]" />
            </div>
            <Typography variant="h3" className="mt-6 font-bold">
              Something went wrong
            </Typography>
            <Typography variant="paragraph-small" color="muted" className="block mt-2">
              {errorMessage}
            </Typography>
          </>
        )}
      </div>
    </div>
  )
}
