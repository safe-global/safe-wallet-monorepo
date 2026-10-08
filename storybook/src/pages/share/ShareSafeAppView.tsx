import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'

export type ShareSafeAppViewProps = {
  landing?: ReactNode
}

export const ShareSafeAppView = ({ landing }: ShareSafeAppViewProps) => {
  return (
    <main>
      {landing ?? (
        <div className="py-8 text-center">
          <Spinner className="mx-auto size-10" />
        </div>
      )}
    </main>
  )
}
