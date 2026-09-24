import type { ReactElement } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { parseSafeScopeKey } from '@/components/tx-flow/safe-scope'
import SafeAccountSelector from '../../SafeAccountSelector'
import type { SafeAccountEntry } from '../../SafeAccountSelector/types'
import type { SpendingLimitPolicyFormValues } from '../types'

export type SafeAccountFieldProps = {
  accounts: SafeAccountEntry[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasWallet: boolean
  /** The picked `${chainId}:${address}`, already split. */
  onSafeChange: (chainId: string, address: string) => void
}

const SafeAccountField = ({
  accounts,
  isLoading,
  isError,
  onRetry,
  hasWallet,
  onSafeChange,
}: SafeAccountFieldProps): ReactElement => {
  const { control } = useFormContext<SpendingLimitPolicyFormValues>()

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
          name={field.name}
          id="spending-limit-safe-account"
        />
      )}
    />
  )
}

export default SafeAccountField
