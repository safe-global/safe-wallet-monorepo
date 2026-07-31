import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Box, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ActivePolicy, AvailablePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { Target } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useSpaceSafes } from '@/features/spaces'
import { SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import {
  WizardLayout,
  VerticalWizard,
  FormHeader,
  ApplyToStep,
  PolicySummaryRow,
  WizardField,
  safeKey,
  type SafeRowItem,
} from '../wizardCommon'
import { flattenSafes } from '../safeRefs'
import { usePolicyGuard } from '../hooks/usePolicyGuard'
import { useStorePolicyRequest } from '../hooks/useStorePolicyRequest'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'
import { useActivePolicies } from '../hooks/useActivePolicies'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { savePolicyRequestApi } from '../policyRequestStore'
import { POLICY_GUARD_DELAY_SEC } from '../shared/guardTx'
import { NO_SELECTOR, OPERATION_CALL } from '../shared/accessSelector'
import { buildFallbackPolicyBatch } from './buildBatch'
import { FALLBACK_POLICY_COPY, isFallbackPolicyType, type FallbackPolicyType } from './contracts'

/** The guard/policy addresses for the chosen fallback type. */
const useFallbackPolicyContracts = (
  chainId: string,
  safeAddress: string,
  policyType: FallbackPolicyType,
): { safePolicyGuard?: string; policyContract?: string } => {
  const { policies: catalogue } = useAvailablePolicies(chainId, safeAddress)
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    const enforcements = [
      catalogue.find((p: AvailablePolicy) => p.type === policyType)?.enforcement,
      active.find((p: ActivePolicy) => p.type === policyType)?.enforcement,
    ]
    const guardEnforcement = enforcements.find((enforcement) => enforcement?.via === 'guard')
    const contracts = guardEnforcement?.via === 'guard' ? guardEnforcement.guards.transactionGuard : undefined

    return { safePolicyGuard: contracts?.safePolicyGuard, policyContract: contracts?.policyContract }
  }, [catalogue, active, policyType])
}

/**
 * Installs one of the fallback policies — Allow, Deny or Native transfers.
 *
 * None of them takes a payload, so there is nothing to configure beyond the Safe (and, for
 * native transfers, an optional recipient). What the flow does add is the consequences:
 * only one fallback applies at a time, so installing one replaces the current one, and Deny
 * blocks everything no other policy covers.
 */
const FallbackPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  const rawType = typeof router.query.fallbackType === 'string' ? router.query.fallbackType : ''
  const policyType: FallbackPolicyType = isFallbackPolicyType(rawType) ? rawType : PolicyType.Allow
  const copy = FALLBACK_POLICY_COPY[policyType]
  const isNativeTransfer = policyType === PolicyType.NativeTransfer

  const preselectedKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(() => {
    const steps = [
      { key: 'apply-to', label: 'Select Safe' },
      // Only native transfers can be narrowed to a recipient; the others are the catch-all.
      ...(isNativeTransfer ? [{ key: 'scope', label: 'Scope' }] : []),
      { key: 'review', label: 'Review' },
    ]

    return preselectedKey ? steps.filter((step) => step.key !== 'apply-to') : steps
  }, [isNativeTransfer, preselectedKey])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [targetInput, setTargetInput] = useState('')
  const [denyConfirmed, setDenyConfirmed] = useState(false)

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const { safePolicyGuard: guardAddress, policyContract } = useFallbackPolicyContracts(chainId, safeAddress, policyType)
  const hasPolicyContracts = !!guardAddress && !!policyContract

  const { currentGuard, isSet: isGuardSet, isUnknownGuard } = usePolicyGuard(chainId, safeAddress, guardAddress)

  const targetTrimmed = targetInput.trim()
  const isTargetValid = targetTrimmed === '' || isAddress(targetTrimmed)
  const scopedTarget = isNativeTransfer && isAddress(targetTrimmed) ? targetTrimmed : undefined

  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()

  const replaced = useReplacedPolicies(
    chainId,
    safeAddress,
    useMemo(
      () => [
        {
          target: scopedTarget ?? '0x0000000000000000000000000000000000000000',
          selector: NO_SELECTOR,
          operation: OPERATION_CALL,
          policy: '',
          data: '',
        },
      ],
      [scopedTarget],
    ),
  )

  const step = STEPS[stepIndex].key
  const continueDisabled = (() => {
    if (step === 'apply-to') return !selectedSafe
    if (step === 'scope') return !isTargetValid
    // Deny blocks everything uncovered, so it takes an explicit acknowledgement.
    return !hasPolicyContracts || (copy.isDestructive && !denyConfirmed)
  })()

  const goBack = () => {
    if (stepIndex === 0) {
      void router.push({ pathname: AppRoutes.spaces.policies, query: { spaceId: router.query.spaceId } })
      return
    }
    setStepIndex((i) => i - 1)
  }

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
    else onReview()
  }

  const onReview = async () => {
    if (!selectedSafe || !guardAddress || !policyContract) return

    const { txs, mode, configurations, configureRoot } = buildFallbackPolicyBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      policyType,
      target: scopedTarget ? (getAddress(scopedTarget) as Address) : undefined,
      allowOverwriteGuard: isUnknownGuard,
    })

    const isRequest = mode === 'request'
    const subtitle = isRequest ? `Request ${copy.title.toLowerCase()}` : copy.title

    const saveSnapshot = () => {
      const requestedAt = Math.floor(Date.now() / 1000)
      savePolicyRequestApi.save({
        id: configureRoot,
        chainId,
        safeAddress,
        type: policyType,
        enforcement: {
          via: 'guard',
          guards: { transactionGuard: { policyContract, safePolicyGuard: guardAddress } },
        },
        configurations,
        configureRoot,
        requestedAt,
        readyAt: requestedAt + POLICY_GUARD_DELAY_SEC,
        delaySec: POLICY_GUARD_DELAY_SEC,
      })
    }

    if (isRequest) saveSnapshot()

    if (isRequest) {
      const stored = await storePolicyRequest({ chainId, safeAddress, root: configureRoot, configurations })

      if (!stored.ok && stored.isCapReached) {
        dispatch(
          showNotification({
            message: 'This Safe has too many pending policy requests. Apply or cancel some to see this one’s details.',
            variant: 'warning',
            groupKey: 'policy-request-store-cap',
          }),
        )
      }
    }

    const chain = chains.find((c) => c.chainId === chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safeAddress}` } },
        undefined,
        { shallow: true },
      )
    }

    setTxFlow(<PolicyBatchFlow txs={txs} subtitle={subtitle} onSubmit={isRequest ? saveSnapshot : undefined} />)
  }

  return (
    <WizardLayout
      wizard={<VerticalWizard steps={STEPS} currentIndex={stepIndex} />}
      form={
        <>
          <FormHeader
            currentIndex={stepIndex}
            onBack={goBack}
            onNext={goNext}
            continueDisabled={continueDisabled}
            isReview={step === 'review'}
            isSubmitting={false}
          />

          {step === 'apply-to' && (
            <ApplyToStep
              safes={safes}
              isLoading={safesLoading}
              selectedKey={selectedKey}
              onSelect={(s) => setSelectedKey(safeKey(s))}
            />
          )}

          {step === 'scope' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Which value transfers?
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                Leave this empty to govern every value transfer, or name one recipient to govern only transfers to it.
              </Typography>

              <WizardField
                icon={<Target size={16} color="#737373" />}
                value={targetInput}
                onChange={setTargetInput}
                placeholder="0x… recipient (optional)"
                state={targetTrimmed === '' ? 'default' : isTargetValid ? 'valid' : 'error'}
                ariaLabel="Recipient address"
              />
            </Stack>
          )}

          {step === 'review' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Review
              </Typography>

              {copy.isDestructive ? (
                <Alert severity="error">
                  <Stack gap={1}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                      This blocks every transaction no other policy covers.
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>
                      Removing the guard is blocked too — the guard only exempts requesting, applying and invalidating
                      policy configurations. To undo this you must request a new configuration and apply it after the
                      guard&apos;s delay.
                    </Typography>
                  </Stack>
                </Alert>
              ) : (
                <Alert severity="info">{copy.effect}</Alert>
              )}

              <ReplacedPolicyWarning policies={replaced} />

              {!hasPolicyContracts && (
                <Alert severity="error">
                  The policy engine isn&apos;t available for this Safe&apos;s network yet, so this change can&apos;t be
                  created.
                </Alert>
              )}

              {isUnknownGuard && (
                <Alert severity="warning">
                  This Safe already has a different transaction guard. Continuing will overwrite it.
                </Alert>
              )}

              {isGuardSet && (
                <Alert severity="info">
                  This Safe already has the policy guard, so this change is time-locked. You&apos;ll request it now and
                  apply it after the guard&apos;s delay has passed.
                </Alert>
              )}

              <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', px: 2, py: 1 }}>
                <PolicySummaryRow
                  label="Safe"
                  isFirst
                  value={
                    selectedSafe && (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <SafeIdenticon address={selectedSafe.address} size={20} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedSafe.name || 'Safe'}</Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                          {shortenAddress(selectedSafe.address)}
                        </Typography>
                      </Stack>
                    )
                  }
                />

                <PolicySummaryRow
                  label="Policy"
                  value={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>{copy.title}</Typography>}
                />

                <PolicySummaryRow
                  label="Applies to"
                  value={
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {scopedTarget ? `Value transfers to ${shortenAddress(scopedTarget)}` : 'Any uncovered call'}
                    </Typography>
                  }
                />
              </Box>

              {copy.isDestructive && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={denyConfirmed}
                      onChange={(e) => setDenyConfirmed(e.target.checked)}
                      inputProps={{ 'aria-label': 'Confirm deny by default' }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      I understand this Safe will only be able to execute calls another policy allows.
                    </Typography>
                  }
                />
              )}
            </Stack>
          )}
        </>
      }
      summary={null}
    />
  )
}

export default FallbackPolicyFlow
