import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import PagePlaceholder from '@views/components/common/PagePlaceholder'
import { AppRoutes } from '@/config/routes'
import Link from 'next/link'

export const GENERIC_LOADING_ERROR = "This Safe account couldn't be loaded"
export const unsupportedNetworkError = (shortName: string) => `The network "${shortName}" isn't supported`

export type SafeLoadingErrorViewProps = {
  error: { kind: 'unsupportedNetwork'; shortName: string } | { kind: 'unavailable'; message?: string }
}

export function SafeLoadingErrorView({ error }: SafeLoadingErrorViewProps): ReactElement {
  const text =
    error.kind === 'unsupportedNetwork'
      ? unsupportedNetworkError(error.shortName)
      : (error.message ?? GENERIC_LOADING_ERROR)

  return (
    <PagePlaceholder
      img={<img src="/images/common/error.png" alt="A vault with a red icon in the bottom right corner" />}
      text={text}
      testId="safe-loading-error"
    >
      <Button size="lg" className="mt-4" data-testid="safe-loading-error-cta" render={<Link href={AppRoutes.index} />}>
        Go to the main page
      </Button>
    </PagePlaceholder>
  )
}
