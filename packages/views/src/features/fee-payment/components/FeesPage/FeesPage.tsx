import type { ReactElement, ReactNode } from 'react'
import type { FeePayerView, GasPayerChoice } from '@safe-global/views/features/fee-payment/types'
import GasPayerSelector, {
  type TokenIconRenderer,
} from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { GasParamsEditor, type GasParamsEditorProps } from '../GasParamsEditor'

export type FeesPageProps = {
  view: FeePayerView
  /** Only when the signer can change the gas settings; the Gas fee row is static otherwise. */
  gasFeeEditor?: GasParamsEditorProps & { open: boolean; onOpenChange: (open: boolean) => void }
  onChoiceChange: (choice: GasPayerChoice) => void
  currency: string
  renderTokenIcon: TokenIconRenderer
  footer: ReactNode
}

export const FeesPage = ({ gasFeeEditor, ...props }: FeesPageProps): ReactElement => (
  <div className="w-full max-w-[600px]">
    <GasPayerSelector
      {...props}
      gasFeeEditor={
        gasFeeEditor && {
          open: gasFeeEditor.open,
          onOpenChange: gasFeeEditor.onOpenChange,
          content: <GasParamsEditor {...gasFeeEditor} />,
        }
      }
    />
  </div>
)
