import { useCallback } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SAVE_CONFIGURATION_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistSetup } from '@/features/policy-guard'
import { useCurrentSpaceId } from '../../../../hooks/useCurrentSpaceId'
import { Errors, logError } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { usePoliciesCreateConfigurationRequestV1Mutation } from '@/store/api/gateway/spacePolicies'
import { showNotification } from '@/store/notificationsSlice'

/** Saves the configuration request in CGW, which needs it stored before it can activate the policy later. */
export const useSaveAllowlistConfiguration = (): {
  save: (setup: Pick<AllowlistSetup, 'configurations' | 'configureRoot'>) => Promise<boolean>
  isSaving: boolean
} => {
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const scope = useSafeScope()
  const [createRequest, { isLoading }] = usePoliciesCreateConfigurationRequestV1Mutation()

  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  const save = useCallback(
    async ({
      configurations,
      configureRoot,
    }: Pick<AllowlistSetup, 'configurations' | 'configureRoot'>): Promise<boolean> => {
      try {
        if (!spaceId || !chainId || !safeAddress) throw new Error('Missing save context')
        await createRequest({
          spaceId,
          chainId,
          safeAddress,
          createPolicyConfigurationRequestDto: {
            root: configureRoot,
            configurations: configurations.map((configuration) => ({
              ...configuration,
              operation: configuration.operation === 1 ? 1 : 0,
            })),
          },
        }).unwrap()
        return true
      } catch (e) {
        logError(Errors._655, e)
        dispatch(showNotification({ variant: 'error', message: SAVE_CONFIGURATION_ERROR, groupKey: 'allowlist-save' }))
        return false
      }
    },
    [spaceId, chainId, safeAddress, createRequest, dispatch],
  )

  return { save, isSaving: isLoading }
}
