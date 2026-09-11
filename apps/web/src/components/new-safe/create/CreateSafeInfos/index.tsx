import InfoWidget from '@/components/new-safe/create/InfoWidget'
import { type ReactElement } from 'react'

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
    <div className="col-span-12">
      <div className="flex flex-col gap-6">
        {staticHint && (
          <div>
            <InfoWidget title={staticHint.title} variant={staticHint.variant} steps={staticHint.steps} />
          </div>
        )}
        {dynamicHint && (
          <div>
            <InfoWidget
              title={dynamicHint.title}
              variant={dynamicHint.variant}
              steps={dynamicHint.steps}
              startExpanded
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateSafeInfos
