import type { ReactElement, ReactNode } from 'react'
import TxSectionTitle from '@safe-global/views/components/tx-flow/common/TxSectionTitle'
import { Typography } from '@safe-global/views/components/ui/typography'

type AllowlistSectionProps = {
  title: string
  description?: string
  children: ReactNode
  'data-testid'?: string
}

/** A Create section: one grey surface with its items on white inside it. */
export const AllowlistSection = ({
  title,
  description,
  children,
  'data-testid': testId,
}: AllowlistSectionProps): ReactElement => (
  <section className="flex flex-col gap-4 rounded-xl bg-muted p-4" data-testid={testId}>
    <div className="flex min-w-0 flex-col gap-1">
      <TxSectionTitle>{title}</TxSectionTitle>
      {description && (
        <Typography variant="paragraph-small" color="muted">
          {description}
        </Typography>
      )}
    </div>
    {children}
  </section>
)
