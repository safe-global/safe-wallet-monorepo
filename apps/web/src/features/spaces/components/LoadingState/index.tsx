import { Spinner } from '@safe-global/design/components/ui/spinner'
import { cn } from '@safe-global/design/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const LoadingState = () => {
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-10" aria-label="Loading content" />
      </div>
    </div>
  )
}

export default LoadingState
