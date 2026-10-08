import type { ReactElement, ReactNode } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorMessageView } from '@views/components/tx/ErrorMessage/ErrorMessageView'

export const TX_WILL_FAIL_MESSAGE =
  'This transaction will most likely fail. To save gas costs, reject this transaction.'

export const getCouldNotCheckMessage = (network?: string): string =>
  `Could not check this transaction. ${network ?? 'The network'} is not responding. Nothing was signed.`

export type TxCheckErrorViewProps = {
  children: ReactNode
  assessmentUrl: string | null
  onHypernativeCtaClick: () => void
}

/** The Hypernative approval-required state: an ErrorMessage without an error, plus the assessment link. */
export const TxCheckErrorView = ({
  children,
  assessmentUrl,
  onHypernativeCtaClick,
}: TxCheckErrorViewProps): ReactElement => {
  return (
    <ErrorMessageView level="error">
      {children}

      {assessmentUrl && (
        <span className="mt-3 block">
          <Button
            variant="surface"
            size="sm"
            className="gap-2"
            onClick={onHypernativeCtaClick}
            render={<a href={assessmentUrl} target="_blank" rel="noreferrer noopener" />}
          >
            Approve in Hypernative
            <ExternalLinkIcon />
          </Button>
        </span>
      )}
    </ErrorMessageView>
  )
}
