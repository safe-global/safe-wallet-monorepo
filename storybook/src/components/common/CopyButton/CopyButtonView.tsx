import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import CopyIcon from '@/public/images/common/copy.svg'
import { Button } from '@/components/ui/button'

export type CopyButtonViewProps = {
  isCopied: boolean
  initialToolTipText?: string
  buttonClassName?: string
}

export function CopyButtonView({
  isCopied,
  initialToolTipText = 'Copy to clipboard',
  buttonClassName,
}: CopyButtonViewProps): ReactElement {
  return (
    <Button variant="ghost" size="icon-xs" aria-label={initialToolTipText} className={buttonClassName}>
      {isCopied ? (
        <Check data-testid="copy-btn-check" className="size-4 text-green-600" />
      ) : (
        <CopyIcon data-testid="copy-btn-icon" className="size-4 text-[var(--color-border-main)]" />
      )}
    </Button>
  )
}
