import InfoWidget from '@/components/new-safe/create/InfoWidget'
import { type ReactElement } from 'react'
import { CreateSafeInfosView } from '@views/components/new-safe/create/CreateSafeInfos/CreateSafeInfosView'

export type CreateSafeInfoVariant = 'info' | 'success' | 'warning' | 'error'

export type CreateSafeInfoItem = {
  title: string
  variant: CreateSafeInfoVariant
  steps: { title: string; text: string | ReactElement }[]
}

const CreateSafeInfos = ({
  staticHint,
  dynamicHint,
}: {
  staticHint?: CreateSafeInfoItem
  dynamicHint?: CreateSafeInfoItem
}) => {
  if (!staticHint && !dynamicHint) {
    return null
  }

  return (
    <CreateSafeInfosView
      staticWidget={
        staticHint && <InfoWidget title={staticHint.title} variant={staticHint.variant} steps={staticHint.steps} />
      }
      dynamicWidget={
        dynamicHint && (
          <InfoWidget title={dynamicHint.title} variant={dynamicHint.variant} steps={dynamicHint.steps} startExpanded />
        )
      }
    />
  )
}

export default CreateSafeInfos
