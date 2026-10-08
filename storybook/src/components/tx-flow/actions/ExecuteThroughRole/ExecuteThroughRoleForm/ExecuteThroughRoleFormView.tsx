import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCheckError from '@/components/tx/TxCheckError'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'

const RoleChip = ({ children }: { children: string }) => <span className={css.roleChip}>{children}</span>

export type ExecuteThroughRoleFormViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  roleKey: string
  permissionsError: string | null
  advancedParams: ReactNode
  multiSendImpossible: boolean
  walletCanPay: boolean
  gasLimitError?: Error
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  slotId?: string
  onChange?: (id: string) => void
  options: { label: string; id: string }[]
  submitDisabled: boolean
  isSubmitLoading: boolean
}

export const ExecuteThroughRoleFormView = ({
  onSubmit,
  roleKey,
  permissionsError,
  advancedParams,
  multiSendImpossible,
  walletCanPay,
  gasLimitError,
  renderCheckWallet,
  slotId,
  onChange,
  options,
  submitDisabled,
  isSubmitLoading,
}: ExecuteThroughRoleFormViewProps): ReactElement => {
  return (
    <>
      <form onSubmit={onSubmit}>
        {!permissionsError && (
          <>
            <Typography className="mb-4">
              Your <RoleChip>{roleKey}</RoleChip> role allows you to execute this transaction without the confirmations
              of other owners.
            </Typography>

            <div className={commonCss.params}>{advancedParams}</div>
          </>
        )}

        {permissionsError && (
          <div className="mb-4">
            <Typography className="mb-4">
              You are a member of the <RoleChip>{roleKey}</RoleChip> role but it does not allow this transaction.
            </Typography>

            <ErrorMessage>{permissionsError}</ErrorMessage>
          </div>
        )}

        <Typography variant="paragraph-mini" className="mb-4 flex gap-[2px] text-muted-foreground">
          Powered by
          <img src="/images/transactions/zodiac-roles.svg" width={16} height={16} alt="Zodiac Roles" />
          <span className={css.zodiac}>Zodiac</span>
        </Typography>

        {multiSendImpossible && (
          <div className="mt-2">
            <ErrorMessage>
              The current configuration of the Zodiac Roles module does not allow executing multiple transactions in
              batch.
            </ErrorMessage>
          </div>
        )}

        {!walletCanPay ? (
          <div className="mt-2">
            <ErrorMessage level="info">
              Your connected wallet doesn&apos;t have enough funds to execute this transaction.
            </ErrorMessage>
          </div>
        ) : (
          gasLimitError && (
            <div className="mt-2">
              <TxCheckError error={gasLimitError} />
            </div>
          )
        )}

        <div className="pt-6">
          <Separator bleed="6" />
        </div>

        <TxCardActions>
          {/* Submit button, also available to non-owner role members */}
          {renderCheckWallet((isOk) => (
            <SplitMenuButton
              selected={slotId}
              onChange={({ id }) => onChange?.(id)}
              options={options}
              disabled={!isOk || submitDisabled}
              loading={isSubmitLoading}
            />
          ))}
        </TxCardActions>
      </form>
    </>
  )
}
