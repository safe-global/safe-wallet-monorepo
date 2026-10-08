import { Copy, Check } from 'lucide-react'
import RowIconAction from '@views/components/common/AccountRow/RowIconAction'

export type CopyAddressButtonViewProps = {
  copied: boolean
  testId: string
  onCopy: () => void
}

export const CopyAddressButtonView = ({ copied, testId, onCopy }: CopyAddressButtonViewProps) => {
  return (
    <RowIconAction
      label="Copy address"
      tooltip={copied ? 'Copied!' : 'Copy address'}
      testId={testId}
      onActivate={onCopy}
    >
      {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
    </RowIconAction>
  )
}
