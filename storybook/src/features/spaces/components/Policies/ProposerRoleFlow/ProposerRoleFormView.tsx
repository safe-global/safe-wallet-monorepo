import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import DialogActions from '@/components/common/DialogActions'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import {
  GRANT_INFO_DESCRIPTION,
  GRANT_INFO_TITLE,
  PROPOSER_FIELD_HELPER,
  PROPOSER_NAME_HELPER,
  PROPOSER_NAME_WORKSPACE_HELPER,
} from './constants'

export type ProposerInputSlotProps = {
  label: string
}

export type ProposerNameInputSlotProps = {
  className: string
  label: string
  placeholder: string
  helperText: ReactNode
  inputSize: 'hero'
}

export type ProposerRoleFormViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  safeAccountSelector: ReactNode
  parentSafeWalletNotice?: ReactNode
  renderProposerInput: (props: ProposerInputSlotProps) => ReactNode
  showNameInput: boolean
  renderNameInput: (props: ProposerNameInputSlotProps) => ReactNode
  isAdmin: boolean
  errorMessage?: ReactNode
  isSubmitting: boolean
  canSubmit: boolean
}

export const ProposerRoleFormView = ({
  onSubmit,
  safeAccountSelector,
  parentSafeWalletNotice,
  renderProposerInput,
  showNameInput,
  renderNameInput,
  isAdmin,
  errorMessage,
  isSubmitting,
  canSubmit,
}: ProposerRoleFormViewProps): ReactElement => (
  <form onSubmit={onSubmit}>
    <TxCard>
      <div className="flex flex-col gap-6">
        <Alert variant="info" className="px-3 py-3 *:data-[slot=alert-description]:text-muted-foreground">
          <AlertSeverityIcon variant="info" />
          <AlertTitle className="text-sm font-normal">{GRANT_INFO_TITLE}</AlertTitle>
          <AlertDescription>{GRANT_INFO_DESCRIPTION}</AlertDescription>
        </Alert>

        {safeAccountSelector}

        {parentSafeWalletNotice}

        <div className="flex flex-col gap-1">
          {renderProposerInput({ label: 'Proposer' })}

          <Typography variant="paragraph-mini" color="muted">
            {PROPOSER_FIELD_HELPER}
          </Typography>
        </div>

        {showNameInput &&
          renderNameInput({
            className: 'gap-1',
            label: 'Proposer name',
            placeholder: 'Type name here',
            helperText: (
              <Typography variant="paragraph-mini" color="muted">
                {isAdmin ? PROPOSER_NAME_WORKSPACE_HELPER : PROPOSER_NAME_HELPER}
              </Typography>
            ),
            inputSize: 'hero',
          })}

        <NetworkWarning action="sign" />

        {errorMessage}
      </div>

      <TxCardActions>
        <DialogActions
          confirmLabel="Submit"
          confirmType="submit"
          confirmTestId="submit-proposer-btn"
          confirmLoading={isSubmitting}
          confirmDisabled={!canSubmit}
          confirmCheckWallet={{ checkNetwork: !isSubmitting, allowProposer: false }}
        />
      </TxCardActions>
    </TxCard>
  </form>
)
