import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { AvailablePolicy, ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { Code, Target, UserCheck } from 'lucide-react'
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
import { savePolicyRequestApi } from '../policyRequestStore'
import { POLICY_GUARD_DELAY_SEC } from '../shared/guardTx'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { NO_SELECTOR, OPERATION_CALL, OPERATION_DELEGATECALL } from '../shared/accessSelector'
import { buildCosignerBatch } from './buildBatch'

const ALL_STEPS = [
  { key: 'apply-to', label: 'Select Safe' },
  { key: 'access', label: 'Which calls' },
  { key: 'cosigner', label: 'Cosigner' },
  { key: 'review', label: 'Review' },
] as const
type StepKey = (typeof ALL_STEPS)[number]['key']

/**
 * The SafePolicyGuard + CoSignerPolicy addresses to build against, from the catalogue,
 * falling back to the Safe's active policy of the same type when CGW reports no wiring.
 */
const useCosignerPolicyContracts = (
  chainId: string,
  safeAddress: string,
): { safePolicyGuard?: string; policyContract?: string } => {
  const { policies: catalogue } = useAvailablePolicies(chainId, safeAddress)
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    const enforcements = [
      catalogue.find((p: AvailablePolicy) => p.type === PolicyType.Cosigner)?.enforcement,
      active.find((p: ActivePolicy) => p.type === PolicyType.Cosigner)?.enforcement,
    ]
    const guardEnforcement = enforcements.find((enforcement) => enforcement?.via === 'guard')
    const contracts = guardEnforcement?.via === 'guard' ? guardEnforcement.guards.transactionGuard : undefined

    return { safePolicyGuard: contracts?.safePolicyGuard, policyContract: contracts?.policyContract }
  }, [catalogue, active])
}

const CosignerPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  // The policies page picks the Safe before opening the wizard.
  const preselectedKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(
    () => (preselectedKey ? ALL_STEPS.filter((step) => step.key !== 'apply-to') : ALL_STEPS),
    [preselectedKey],
  )

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [targetInput, setTargetInput] = useState('')
  const [selectorInput, setSelectorInput] = useState('')
  const [operation, setOperation] = useState(OPERATION_CALL)
  const [cosignerInput, setCosignerInput] = useState('')

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const { safePolicyGuard: guardAddress, policyContract } = useCosignerPolicyContracts(chainId, safeAddress)
  const hasPolicyContracts = !!guardAddress && !!policyContract

  const { currentGuard, isSet: isGuardSet, isUnknownGuard } = usePolicyGuard(chainId, safeAddress, guardAddress)

  const targetTrimmed = targetInput.trim()
  const isTargetValid = isAddress(targetTrimmed)
  const selectorTrimmed = selectorInput.trim()
  // Empty is meaningful: calls that carry no function data, i.e. plain value transfers.
  const isSelectorValid = selectorTrimmed === '' || /^0x[0-9a-fA-F]{8}$/.test(selectorTrimmed)

  const access = useMemo(
    () => ({ target: targetTrimmed, selector: selectorTrimmed || NO_SELECTOR, operation }),
    [targetTrimmed, selectorTrimmed, operation],
  )

  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()

  // The guard keeps one policy per access, so an occupied access is replaced silently.
  const replaced = useReplacedPolicies(
    chainId,
    safeAddress,
    useMemo(() => (isTargetValid ? [{ ...access, policy: '', data: '' }] : []), [access, isTargetValid]),
  )

  const cosignerTrimmed = cosignerInput.trim()
  const isCosignerValid = isAddress(cosignerTrimmed)
  // A Safe cosigning its own transactions could never satisfy the check.
  const isCosignerSelf = isCosignerValid && cosignerTrimmed.toLowerCase() === safeAddress.toLowerCase()

  const continueDisabled = (() => {
    const step = STEPS[stepIndex].key as StepKey
    if (step === 'apply-to') return !selectedSafe
    if (step === 'access') return !isTargetValid || !isSelectorValid
    if (step === 'cosigner') return !isCosignerValid || isCosignerSelf
    return !hasPolicyContracts
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
    if (!selectedSafe || !guardAddress || !policyContract || !isCosignerValid) return

    const { txs, mode, configurations, configureRoot } = buildCosignerBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      cosigner: getAddress(cosignerTrimmed) as Address,
      accesses: [access],
      allowOverwriteGuard: isUnknownGuard,
    })

    const isRequest = mode === 'request'
    const subtitle = isRequest ? 'Request cosigner change' : 'Cosigner policy'

    // Snapshot the requested change. `requestConfiguration` publishes only the root, so
    // this is what names the policies behind it in the review screen — and what lets the
    // Pending section offer Apply once the delay has elapsed. Saved before the flow opens
    // (de-duped by root) and again on submission, which stamps the real request time.
    const saveSnapshot = () => {
      const requestedAt = Math.floor(Date.now() / 1000)
      savePolicyRequestApi.save({
        id: configureRoot,
        chainId,
        safeAddress,
        type: PolicyType.Cosigner,
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

  const step = STEPS[stepIndex].key as StepKey

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

          {step === 'access' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Which calls need a cosigner?
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                A policy is bound to a target, a function and an operation. Amounts aren&apos;t part of that, so the
                cosigner is required however much the call moves.
              </Typography>

              <Stack gap={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>To (target)</Typography>
                <WizardField
                  icon={<Target size={16} color="#737373" />}
                  value={targetInput}
                  onChange={setTargetInput}
                  placeholder="0x… contract or account this policy covers"
                  state={targetTrimmed === '' ? 'default' : isTargetValid ? 'valid' : 'error'}
                  ariaLabel="Target address"
                />
              </Stack>

              <Stack gap={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                  Function selector
                </Typography>
                <WizardField
                  icon={<Code size={16} color="#737373" />}
                  value={selectorInput}
                  onChange={setSelectorInput}
                  placeholder="0xa9059cbb — leave empty for plain value transfers"
                  state={selectorTrimmed === '' ? 'default' : isSelectorValid ? 'valid' : 'error'}
                  ariaLabel="Function selector"
                />
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {selectorTrimmed === ''
                    ? 'Empty covers calls that carry no function data — a plain value transfer.'
                    : 'The 4-byte selector of the function to cover, e.g. 0xa9059cbb for an ERC-20 transfer.'}
                </Typography>
              </Stack>

              <Stack gap={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>Operation</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={operation}
                  onChange={(_e, next) => next !== null && setOperation(next)}
                  aria-label="Operation"
                >
                  <ToggleButton value={OPERATION_CALL} aria-label="Call">
                    Call
                  </ToggleButton>
                  <ToggleButton value={OPERATION_DELEGATECALL} aria-label="Delegate call">
                    Delegate call
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          )}

          {step === 'cosigner' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Who has to cosign?
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                Every transfer of the selected tokens will need this address&apos;s signature, whatever the amount — the
                policy has no threshold.
              </Typography>

              <WizardField
                icon={<UserCheck size={16} color="#737373" />}
                value={cosignerInput}
                onChange={setCosignerInput}
                placeholder="0x… cosigner address"
                state={cosignerTrimmed === '' ? 'default' : isCosignerValid && !isCosignerSelf ? 'valid' : 'error'}
                ariaLabel="Cosigner address"
              />

              {isCosignerSelf && (
                <Alert severity="error">
                  The Safe can&apos;t cosign its own transactions. Choose a different address.
                </Alert>
              )}
            </Stack>
          )}

          {step === 'review' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Review
              </Typography>

              {/* The guard reads the cosigner's signature from the tail of the `signatures`
                  bytes, which this wallet doesn't append yet. */}
              <Alert severity="warning">
                A cosigner&apos;s signature will be required at execution for the combination of (to, selector,
                operation).
              </Alert>

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
                  label="To"
                  value={
                    isTargetValid && (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <SafeIdenticon address={targetTrimmed} size={16} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{shortenAddress(targetTrimmed)}</Typography>
                      </Stack>
                    )
                  }
                />

                <PolicySummaryRow
                  label="Function"
                  value={
                    <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                      {selectorTrimmed || 'value transfer (no selector)'}
                    </Typography>
                  }
                />

                <PolicySummaryRow
                  label="Operation"
                  value={
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {operation === OPERATION_DELEGATECALL ? 'Delegate call' : 'Call'}
                    </Typography>
                  }
                />

                <PolicySummaryRow
                  label="Cosigner"
                  value={
                    isCosignerValid && (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <SafeIdenticon address={cosignerTrimmed} size={16} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {shortenAddress(cosignerTrimmed)}
                        </Typography>
                      </Stack>
                    )
                  }
                />
              </Box>
            </Stack>
          )}
        </>
      }
      summary={null}
    />
  )
}

export default CosignerPolicyFlow
