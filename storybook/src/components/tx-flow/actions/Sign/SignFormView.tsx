import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Separator } from '@/components/ui/separator'
import ErrorMessage from '@/components/tx/ErrorMessage'
import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import SplitMenuButton from '@/components/common/SplitMenuButton'

export type SignFormViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  hasSigned: boolean
  cannotPropose: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  slotId?: string
  onOptionChange: (id: string) => void
  options: { label: string; id: string }[]
  submitDisabled: boolean
  isSubmitLoading: boolean
  tooltip?: string
}

export const SignFormView = ({
  onSubmit,
  hasSigned,
  cannotPropose,
  renderCheckWallet,
  slotId,
  onOptionChange,
  options,
  submitDisabled,
  isSubmitLoading,
  tooltip,
}: SignFormViewProps): ReactElement => {
  return (
    <div className="flex flex-col gap-6">
      {hasSigned && <ErrorMessage level="warning">You have already signed this transaction.</ErrorMessage>}

      {cannotPropose && <NonOwnerError />}

      <div>
        <Separator bleed="6" />

        {/* Submit button */}
        <TxCardActions>
          <form onSubmit={onSubmit}>
            {renderCheckWallet((isOk) => (
              <SplitMenuButton
                selected={slotId}
                onChange={({ id }) => onOptionChange(id)}
                options={options}
                disabled={!isOk || submitDisabled}
                loading={isSubmitLoading}
                tooltip={isOk ? tooltip : undefined}
              />
            ))}
          </form>
        </TxCardActions>
      </div>
    </div>
  )
}
