import type { ReactElement } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState } from './WidgetEmptyState'

interface WidgetErrorStateProps {
  message?: string
  onRefresh?: () => void
}

const WidgetErrorState = ({ message = 'Failed to load data', onRefresh }: WidgetErrorStateProps): ReactElement => {
  return (
    <WidgetEmptyState
      icon={<TriangleAlert className="size-6" />}
      text={message}
      action={
        onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        )
      }
    />
  )
}

export { WidgetErrorState }
export type { WidgetErrorStateProps }
