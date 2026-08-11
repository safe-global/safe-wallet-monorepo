import { type ReactElement } from 'react'
import { Typography } from '@safe-global/design-system/components/typography'

export const SafeShieldAnalysisEmpty = (): ReactElement => (
  <Typography variant="paragraph-small" align="center" className="block p-4 text-[var(--color-text-secondary)]">
    Transaction details will be automatically scanned for potential risks and will appear here.
  </Typography>
)
