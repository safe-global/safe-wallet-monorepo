import { pollSafeInfo } from '@/components/new-safe/create/logic'
import {
  safeCreationDispatch,
  SafeCreationEvent,
  safeCreationSubscribe,
} from '@/features/counterfactual/services/safeCreationEvents'
import {
  removeUndeployedSafe,
  selectUndeployedSafes,
  updateUndeployedSafeStatus,
} from '@/features/counterfactual/store/undeployedSafesSlice'
import {
  checkSafeActionViaRelay,
  checkSafeActivation,
  extractCounterfactualSafeSetup,
} from '@/features/counterfactual/utils'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { CREATE_SAFE_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { useEffect, useRef } from 'react'
import { isSmartContract } from '@/utils/wallets'
import { gtmSetSafeAddress } from '@/services/analytics/gtm'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'

export const safeCreationPendingStatuses: Partial<Record<SafeCreationEvent, PendingSafeStatus | null>> = {
  [SafeCreationEvent.AWAITING_EXECUTION]: PendingSafeStatus.AWAITING_EXECUTION,
  [SafeCreationEvent.PROCESSING]: PendingSafeStatus.PROCESSING,
  [SafeCreationEvent.RELAYING]: PendingSafeStatus.RELAYING,
  [SafeCreationEvent.SUCCESS]: null,
  [SafeCreationEvent.INDEXED]: null,
  [SafeCreationEvent.FAILED]: null,
  [SafeCreationEvent.REVERTED]: null,
}

const usePendingSafeMonitor = (): void => {
  const undeployedSafesByChain = useAppSelector(selectUndeployedSafes)
  const provider = useWeb3ReadOnly()
  const dispatch = useAppDispatch()

  // Prevent monitoring the same safe more than once
  const monitoredSafes = useRef<{ [safeAddress: string]: boolean }>({})

  // Monitor pending safe creation mining/validating progress
  useEffect(() => {
    Object.entries(undeployedSafesByChain).forEach(([chainId, undeployedSafes]) => {
      Object.entries(undeployedSafes).forEach(([safeAddress, undeployedSafe]) => {
        if (undeployedSafe?.status.status === PendingSafeStatus.AWAITING_EXECUTION) {
          monitoredSafes.current[safeAddress] = false
        }

        if (!provider || !undeployedSafe || undeployedSafe.status.status === PendingSafeStatus.AWAITING_EXECUTION) {
          return
        }

        const monitorPendingSafe = async () => {
          const {
            status: { status, txHash, taskId, startBlock, type },
          } = undeployedSafe

          const isProcessing = status === PendingSafeStatus.PROCESSING && txHash !== undefined
          const isRelaying = status === PendingSafeStatus.RELAYING && taskId !== undefined
          const isMonitored = monitoredSafes.current[safeAddress]

          if ((!isProcessing && !isRelaying) || isMonitored) return

          monitoredSafes.current[safeAddress] = true

          if (isProcessing) {
            checkSafeActivation(provider, txHash, safeAddress, type, chainId, startBlock)
          }

          if (isRelaying) {
            checkSafeActionViaRelay(taskId, safeAddress, type, chainId)
          }
        }

        monitorPendingSafe()
      })
    })
  }, [dispatch, provider, undeployedSafesByChain])
}

const usePendingSafeStatus = (): void => {
  const dispatch = useAppDispatch()
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  usePendingSafeMonitor()

  // Clear undeployed safe state if already deployed
  useEffect(() => {
    if (!provider || !safeAddress) return

    const checkDeploymentStatus = async () => {
      // In case the safe info hasn't been updated yet when switching safes
      const { chainId } = await provider.getNetwork()
      if (chainId !== BigInt(safe.chainId)) return

      const isContractDeployed = await isSmartContract(safeAddress)

      if (isContractDeployed) {
        dispatch(removeUndeployedSafe({ chainId: safe.chainId, address: safeAddress }))
      }
    }

    checkDeploymentStatus()
  }, [safe.chainId, dispatch, provider, safeAddress])

  // Subscribe to pending safe statuses
  useEffect(() => {
    const unsubFns = Object.entries(safeCreationPendingStatuses).map(([event, status]) =>
      safeCreationSubscribe(event as SafeCreationEvent, async (detail) => {
        const creationChainId = 'chainId' in detail ? detail.chainId : chainId

        if (event === SafeCreationEvent.SUCCESS) {
          gtmSetSafeAddress(detail.safeAddress)

          // TODO: Possible to add a label with_tx, without_tx?

          const undeployedSafe = undeployedSafes[creationChainId]?.[detail.safeAddress]
          const isCounterfactual = 'type' in detail && detail.type === PayMethod.PayLater
          const isRelayed = undeployedSafe?.status.status === PendingSafeStatus.RELAYING

          if (undeployedSafe && isCounterfactual) {
            // Counterfactual deployment activation
            const safeSetup = extractCounterfactualSafeSetup(undeployedSafe, creationChainId)
            if (safeSetup) {
              trackEvent(CREATE_SAFE_EVENTS.ACTIVATED_SAFE, {
                [MixpanelEventParams.SAFE_ADDRESS]: detail.safeAddress,
                [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chain?.chainName || '',
                [MixpanelEventParams.NUMBER_OF_OWNERS]: safeSetup.owners.length,
                [MixpanelEventParams.THRESHOLD]: safeSetup.threshold,
                [MixpanelEventParams.ENTRY_POINT]: 'Counterfactual Activation',
                [MixpanelEventParams.DEPLOYMENT_TYPE]: 'Counterfactual',
                [MixpanelEventParams.PAYMENT_METHOD]: isRelayed ? 'Sponsored' : 'Self-paid',
              })
            } else {
              trackEvent(CREATE_SAFE_EVENTS.ACTIVATED_SAFE)
            }
          } else if (undeployedSafe && !isCounterfactual) {
            // Direct deployment activation
            const safeSetup = extractCounterfactualSafeSetup(undeployedSafe, creationChainId)
            if (safeSetup) {
              trackEvent(CREATE_SAFE_EVENTS.ACTIVATED_SAFE, {
                [MixpanelEventParams.SAFE_ADDRESS]: detail.safeAddress,
                [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chain?.chainName || '',
                [MixpanelEventParams.NUMBER_OF_OWNERS]: safeSetup.owners.length,
                [MixpanelEventParams.THRESHOLD]: safeSetup.threshold,
                [MixpanelEventParams.ENTRY_POINT]: 'Direct',
                [MixpanelEventParams.DEPLOYMENT_TYPE]: 'Direct',
                [MixpanelEventParams.PAYMENT_METHOD]: isRelayed ? 'Sponsored' : 'Self-paid',
              })
            } else {
              trackEvent(CREATE_SAFE_EVENTS.ACTIVATED_SAFE)
            }
          } else {
            // Fallback for cases without undeployedSafe
            trackEvent(CREATE_SAFE_EVENTS.ACTIVATED_SAFE)
          }

          pollSafeInfo(creationChainId, detail.safeAddress).finally(() => {
            safeCreationDispatch(SafeCreationEvent.INDEXED, {
              groupKey: detail.groupKey,
              safeAddress: detail.safeAddress,
              chainId: creationChainId,
            })
          })
          return
        }

        if (event === SafeCreationEvent.INDEXED) {
          dispatch(removeUndeployedSafe({ chainId: creationChainId, address: detail.safeAddress }))
        }

        if (status === null) {
          dispatch(
            updateUndeployedSafeStatus({
              chainId: creationChainId,
              address: detail.safeAddress,
              status: {
                status: PendingSafeStatus.AWAITING_EXECUTION,
                startBlock: undefined,
                txHash: undefined,
                submittedAt: undefined,
              },
            }),
          )
          return
        }

        dispatch(
          updateUndeployedSafeStatus({
            chainId: creationChainId,
            address: detail.safeAddress,
            status: {
              status,
              txHash: 'txHash' in detail ? detail.txHash : undefined,
              taskId: 'taskId' in detail ? detail.taskId : undefined,
              startBlock: await provider?.getBlockNumber(),
              submittedAt: Date.now(),
            },
          }),
        )
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [chainId, dispatch, provider, chain?.chainName, undeployedSafes])
}

export default usePendingSafeStatus
