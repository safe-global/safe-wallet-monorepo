import type { ReactElement } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { parseSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope'
import SafeAccountSelector from '../../SafeAccountSelector'
import {
  getNestedSafesNoticeText,
  NESTED_SAFES_NOTICE_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import type { SafeAccountEntry } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { GuardPolicyBaseFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'

const SPENDING_LIMITS_NOTICE = {
  title: NESTED_SAFES_NOTICE_TITLE,
  description: getNestedSafesNoticeText('spending limits'),
}

export type SafeAccountFieldProps = {
  accounts: SafeAccountEntry[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasWallet: boolean
  /** The picked `${chainId}:${address}`, already split. */
  onSafeChange: (chainId: string, address: string) => void
  readOnly?: boolean
  /** Defaults to the spending limit's nested Safes notice; `null` shows none. */
  notice?: { title: string; description: string } | null
  id?: string
}

const SafeAccountField = ({
  accounts,
  isLoading,
  isError,
  onRetry,
  hasWallet,
  onSafeChange,
  readOnly = false,
  notice = SPENDING_LIMITS_NOTICE,
  id = 'spending-limit-safe-account',
}: SafeAccountFieldProps): ReactElement => {
  // Any policy form keyed by `safe`: the spending limit's and the guard policies'.
  const { control } = useFormContext<GuardPolicyBaseFormValues>()

  return (
    <Controller
      control={control}
      name="safe"
      rules={{ required: true }}
      render={({ field }) => (
        <SafeAccountSelector
          accounts={accounts}
          value={field.value || undefined}
          onChange={(id) => {
            field.onChange(id)
            const target = parseSafeScopeKey(id)
            if (target) onSafeChange(target.chainId, target.safeAddress)
          }}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          hasWallet={hasWallet}
          readOnly={readOnly}
          notice={notice ?? undefined}
          name={field.name}
          id={id}
        />
      )}
    />
  )
}

export default SafeAccountField
