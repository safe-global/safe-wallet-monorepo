import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeUnavailableMessage from '@/hooks/useSafeUnavailableMessage'
import { useUrlChain } from '@/hooks/useChainId'
import PagePlaceholder from '../PagePlaceholder'
import { AppRoutes } from '@/config/routes'
import Link from 'next/link'

export const GENERIC_LOADING_ERROR = "This Safe account couldn't be loaded"
export const unsupportedNetworkError = (shortName: string) => `The network "${shortName}" isn't supported`

const ErrorPlaceholder = ({ text }: { text: string }): ReactElement => (
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

const SafeLoadingError = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeError } = useSafeInfo()
  const unavailableMessage = useSafeUnavailableMessage()
  const urlChain = useUrlChain()

  if (urlChain.status === 'unknown') return <ErrorPlaceholder text={unsupportedNetworkError(urlChain.shortName)} />

  if (!safeError) return <>{children}</>

  return <ErrorPlaceholder text={unavailableMessage ?? GENERIC_LOADING_ERROR} />
}

export default SafeLoadingError
