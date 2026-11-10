import type { ReactElement, ReactNode } from 'react'
import type { FeePayerView, GasPayerChoice } from '@safe-global/views/features/fee-payment/types'
import GasPayerSelector, {
  type TokenIconRenderer,
} from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { GasParamsEditor, type GasParamsEditorProps } from '../GasParamsEditor'
import { GasParamsSummary, type GasParamsSummaryProps } from '../GasParamsSummary'

type Toggle = { open: boolean; onOpenChange: (open: boolean) => void }

export type GasFeeDetailsProps =
  | (Toggle & { mode: 'edit'; editor: GasParamsEditorProps })
  | (Toggle & { mode: 'view'; summary: GasParamsSummaryProps })

export type FeesPageProps = {
  view: FeePayerView
  gasFeeDetails: GasFeeDetailsProps
  onChoiceChange: (choice: GasPayerChoice) => void
  currency: string
  renderTokenIcon: TokenIconRenderer
  footer: ReactNode
}

export const FeesPage = ({ gasFeeDetails, ...props }: FeesPageProps): ReactElement => (
  <div className="w-full max-w-[600px]">
    <GasPayerSelector
      {...props}
      gasFeeDetails={{
        mode: gasFeeDetails.mode,
        open: gasFeeDetails.open,
        onOpenChange: gasFeeDetails.onOpenChange,
        content:
          gasFeeDetails.mode === 'edit' ? (
            <GasParamsEditor {...gasFeeDetails.editor} />
          ) : (
            <GasParamsSummary {...gasFeeDetails.summary} />
          ),
      }}
    />
  </div>
)
