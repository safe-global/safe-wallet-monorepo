import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'

const DrawerSection = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="flex flex-col gap-2">
    <Typography variant="paragraph-mini" color="muted">
      {label}
    </Typography>
    {children}
  </div>
)

export default DrawerSection
