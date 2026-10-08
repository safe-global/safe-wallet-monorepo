import { type ReactElement, useRef } from 'react'
import type { CreateSafeInfoVariant } from '@/components/new-safe/create/CreateSafeInfos'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { InfoWidgetView } from '@views/components/new-safe/create/InfoWidget/InfoWidgetView'

type InfoWidgetProps = {
  title: string
  steps: { title: string; text: string | ReactElement }[]
  variant: CreateSafeInfoVariant
  startExpanded?: boolean
}

const InfoWidget = ({ title, steps, variant, startExpanded = false }: InfoWidgetProps): ReactElement | null => {
  const openCount = useRef(startExpanded ? steps.length : 0)

  if (steps.length === 0) {
    return null
  }

  return (
    <InfoWidgetView
      title={title}
      steps={steps}
      variant={variant}
      startExpanded={startExpanded}
      onValueChange={(value) => {
        const openValues = value.filter((item): item is string => typeof item === 'string')
        if (openValues.length > openCount.current) {
          const opened = openValues.at(-1)
          if (opened) {
            trackEvent({ ...CREATE_SAFE_EVENTS.OPEN_HINT, label: opened })
          }
        }
        openCount.current = openValues.length
      }}
    />
  )
}

export default InfoWidget
