import type { ReactElement, ReactNode } from 'react'
import TxSectionTitle from '@safe-global/views/components/tx-flow/common/TxSectionTitle'
import { Typography } from '@safe-global/views/components/ui/typography'

/** Every row on the Create form shares the account field's height. */
export const ALLOWLIST_ROW_CLASSES = 'flex min-h-16 flex-col justify-center gap-3 rounded-lg bg-card p-3'

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

/** A white row standing in for a list that fills once a Safe account is picked. */
export const AllowlistEmptyItem = ({ children }: { children: ReactNode }): ReactElement => (
  <div className={ALLOWLIST_ROW_CLASSES}>
    <Typography variant="paragraph-small" color="muted">
      {children}
    </Typography>
  </div>
)
