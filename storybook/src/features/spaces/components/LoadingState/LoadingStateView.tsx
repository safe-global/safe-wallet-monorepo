import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'

export type LoadingStateViewProps = {
  isDarkMode: boolean
}

export const LoadingStateView = ({ isDarkMode }: LoadingStateViewProps) => {
  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-10" aria-label="Loading content" />
      </div>
    </div>
  )
}
