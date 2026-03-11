import type { ReactElement } from 'react'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState } from './WidgetEmptyState'

interface WidgetErrorStateProps {
  message?: string
  onRefresh?: () => void
}

const WidgetErrorState = ({ message = 'Unable to load content', onRefresh }: WidgetErrorStateProps): ReactElement => {
  return (
    <WidgetEmptyState
      icon={<CircleAlert className="size-6" />}
      text={message}
      subtitle="Try to reload the page."
      action={
        onRefresh && (
          <Button className="px-6" onClick={onRefresh}>
            Reload page
          </Button>
        )
      }
    />
  )
}

export { WidgetErrorState }
export type { WidgetErrorStateProps }
