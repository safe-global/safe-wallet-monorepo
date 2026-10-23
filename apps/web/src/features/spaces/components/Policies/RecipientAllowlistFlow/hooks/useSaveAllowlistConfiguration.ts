import { useCallback } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SAVE_CONFIGURATION_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature, type PolicyConfiguration } from '@/features/policy-guard'
import { useCurrentSpaceId } from '../../../../hooks/useCurrentSpaceId'
import { Errors, logError } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { usePoliciesCreateConfigurationRequestV1Mutation } from '@/store/api/gateway/spacePolicies'
import { showNotification } from '@/store/notificationsSlice'

/** Saves the configuration request in CGW, which needs it stored before it can activate the policy later. */
export const useSaveAllowlistConfiguration = (): {
  save: (configurations: PolicyConfiguration[]) => Promise<boolean>
  isSaving: boolean
} => {
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const scope = useSafeScope()
  const { getConfigurationRoot, $isReady } = useLoadFeature(PolicyGuardFeature)
  const [createRequest, { isLoading }] = usePoliciesCreateConfigurationRequestV1Mutation()

  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  const save = useCallback(
    async (configurations: PolicyConfiguration[]): Promise<boolean> => {
      try {
        if (!spaceId || !chainId || !safeAddress || !$isReady) throw new Error('Missing save context')
        await createRequest({
          spaceId,
          chainId,
          safeAddress,
          createPolicyConfigurationRequestDto: {
            root: getConfigurationRoot(configurations),
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
    [spaceId, chainId, safeAddress, $isReady, getConfigurationRoot, createRequest, dispatch],
  )

  return { save, isSaving: isLoading }
}
