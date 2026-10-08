import type { RefObject } from 'react'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'

export type HubSpotFormViewProps = {
  formContainerRef: RefObject<HTMLDivElement | null>
  isLoading: boolean
}

export const HubSpotFormView = ({ formContainerRef, isLoading }: HubSpotFormViewProps) => {
  return (
    <div className="min-h-full bg-[var(--color-static-primary)] py-2">
      <Typography variant="h3" className="mb-2 text-[var(--color-static-main)]">
        Request demo
      </Typography>
      <Typography variant="paragraph" className="mb-8 text-[var(--color-static-light)]">
        Share your details to book a demo call.
      </Typography>
      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner className="size-10 text-[var(--color-static-main)]" />
        </div>
      )}
      <div id="hubspot-form-container" ref={formContainerRef} style={{ display: isLoading ? 'none' : 'block' }} />
    </div>
  )
}
