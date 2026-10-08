import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type CookiesSettingsViewProps = {
  cookieBanner: ReactNode
}

export const CookiesSettingsView = ({ cookieBanner }: CookiesSettingsViewProps) => {
  return (
    <main>
      <div className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr]">
          <div>
            <Typography variant="h4">Cookie preferences</Typography>
          </div>

          <div>{cookieBanner}</div>
        </div>
      </div>
    </main>
  )
}
