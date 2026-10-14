import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useSpaceSafes } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import {
  WizardLayout,
  VerticalWizard,
  FormHeader,
  ApplyToStep,
  PolicySummaryRow,
  safeKey,
  type SafeRowItem,
} from '../wizardCommon'
import { flattenSafes } from '../safeRefs'
import { usePolicyGuard } from '../hooks/usePolicyGuard'
import { useStorePolicyRequest } from '../hooks/useStorePolicyRequest'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { savePolicyRequestApi } from '../policyRequestStore'
import { POLICY_GUARD_DELAY_SEC } from '../shared/guardTx'
import { OPERATION_CALL } from '../shared/accessSelector'
import { usePolicyContracts } from '../shared/usePolicyContracts'
import { buildSafeManagementBatch } from './buildBatch'
import { GUARD_CRITICAL_FUNCTION_IDS, SAFE_MANAGEMENT_FUNCTIONS, type SafeManagementFunction } from './contracts'

const CONTRACT_GROUPS: Array<{ contract: SafeManagementFunction['contract']; label: string }> = [
  { contract: 'OwnerManager', label: 'Signers' },
  { contract: 'ModuleManager', label: 'Modules' },
  { contract: 'GuardManager', label: 'Guards' },
  { contract: 'FallbackManager', label: 'Fallback handler' },
]

/**
 * Chooses which of the Safe's own management functions stay permitted under the guard.
 *
 * Each selected function gets its own `(safe, selector, CALL)` access bound to AllowPolicy.
 * Anything left out has no access of its own and falls through to the Safe's fallback policy,
 * so this only restricts in combination with a Deny fallback — which is why the review says so
 * rather than implying the unselected functions are blocked outright.
 */
const SafeManagementPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  const preselectedKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(() => {
    const steps = [
      { key: 'apply-to', label: 'Select Safe' },
      { key: 'functions', label: 'Choose functions' },
      { key: 'review', label: 'Review' },
    ]

    return preselectedKey ? steps.filter((step) => step.key !== 'apply-to') : steps
  }, [preselectedKey])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => SAFE_MANAGEMENT_FUNCTIONS.map((fn) => fn.id))
  const [guardLockConfirmed, setGuardLockConfirmed] = useState(false)

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const selectedFunctions = useMemo(
    () => SAFE_MANAGEMENT_FUNCTIONS.filter((fn) => selectedIds.includes(fn.id)),
    [selectedIds],
  )

  // Dropping setGuard means the guard can only be replaced if the fallback policy permits it.
  const isGuardLocked = GUARD_CRITICAL_FUNCTION_IDS.some((id) => !selectedIds.includes(id))

  const { safePolicyGuard: guardAddress, policyContract } = usePolicyContracts(chainId, safeAddress, PolicyType.Allow)
  const hasPolicyContracts = !!guardAddress && !!policyContract

  const { currentGuard, isUnknownGuard } = usePolicyGuard(chainId, safeAddress, guardAddress)

  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()

  const replaced = useReplacedPolicies(
    chainId,
    safeAddress,
    useMemo(
      () =>
        safeAddress
          ? selectedFunctions.map((fn) => ({
              target: safeAddress,
              selector: fn.selector,
              operation: OPERATION_CALL,
              policy: '',
              data: '',
            }))
          : [],
      [safeAddress, selectedFunctions],
    ),
  )

  const toggle = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id]))

  const step = STEPS[stepIndex].key
  const continueDisabled = (() => {
    if (step === 'apply-to') return !selectedSafe
    if (step === 'functions') return selectedFunctions.length === 0
    return !hasPolicyContracts || (isGuardLocked && !guardLockConfirmed)
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

    const { txs, mode, configurations, configureRoot } = buildSafeManagementBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      selectors: selectedFunctions.map((fn) => fn.selector),
      allowOverwriteGuard: isUnknownGuard,
    })

    const isRequest = mode === 'request'
    const subtitle = isRequest ? 'Request Safe management policy' : 'Safe management policy'

    const saveSnapshot = () => {
      const requestedAt = Math.floor(Date.now() / 1000)
      savePolicyRequestApi.save({
        id: configureRoot,
        chainId,
        safeAddress,
        type: PolicyType.Allow,
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

    if (isRequest) {
      saveSnapshot()

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
              title="Which Safe does this apply to?"
            />
          )}

          {step === 'functions' && (
            <div className="flex flex-col gap-6" data-testid="safe-management-functions">
              <div className="flex flex-col gap-2">
                <Typography variant="h3">Which changes stay allowed?</Typography>
                <Typography variant="paragraph-small" className="text-muted-foreground">
                  Each selected function keeps its own permission under the policy guard. Anything you leave out is
                  governed by this Safe&apos;s fallback policy instead.
                </Typography>
              </div>

              {CONTRACT_GROUPS.map(({ contract, label }) => {
                const functions = SAFE_MANAGEMENT_FUNCTIONS.filter((fn) => fn.contract === contract)
                if (functions.length === 0) return null

                return (
                  <div key={contract} className="flex flex-col gap-1">
                    <Typography
                      variant="paragraph-mini-medium"
                      className="tracking-wider text-muted-foreground uppercase"
                    >
                      {label}
                    </Typography>

                    {functions.map((fn) => (
                      <Label key={fn.id} className="flex items-start gap-2 py-1 font-normal">
                        <Checkbox
                          checked={selectedIds.includes(fn.id)}
                          onCheckedChange={() => toggle(fn.id)}
                          aria-label={fn.label}
                          className="mt-0.5"
                        />
                        <span className="flex flex-col">
                          <Typography variant="paragraph-small-bold">{fn.label}</Typography>
                          <Typography variant="paragraph-mini" className="text-muted-foreground">
                            {fn.description}
                          </Typography>
                        </span>
                      </Label>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <Typography variant="h3">Safe management</Typography>

              {replaced.length > 0 && <ReplacedPolicyWarning policies={replaced} />}

              {!!chainId && !hasPolicyContracts && (
                <Alert variant="warning">
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    The policy engine isn&apos;t available on this chain yet, so this policy can&apos;t be configured.
                  </AlertDescription>
                </Alert>
              )}

              {isGuardLocked && (
                <Alert variant="warning">
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    <Typography variant="paragraph-small" className="mb-2 block">
                      You left out a guard change. If this Safe&apos;s fallback policy blocks what it doesn&apos;t
                      cover, the policy guard can no longer be replaced — recovery then means requesting a new
                      configuration and waiting out the delay.
                    </Typography>
                    <Label className="flex items-center gap-2 font-normal">
                      <Checkbox
                        checked={guardLockConfirmed}
                        onCheckedChange={(checked) => setGuardLockConfirmed(checked === true)}
                        aria-label="I understand the guard may become unremovable"
                      />
                      <Typography variant="paragraph-small">I understand</Typography>
                    </Label>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                {selectedSafe && <PolicySummaryRow isFirst label="Safe" value={shortenAddress(selectedSafe.address)} />}
                <PolicySummaryRow
                  label="Allowed"
                  value={selectedFunctions.map((fn) => fn.label).join(', ') || 'Nothing selected'}
                />
                <PolicySummaryRow
                  label="Falls back"
                  value={
                    SAFE_MANAGEMENT_FUNCTIONS.filter((fn) => !selectedIds.includes(fn.id))
                      .map((fn) => fn.label)
                      .join(', ') || 'Nothing'
                  }
                />
              </div>
            </div>
          )}
        </>
      }
      summary={null}
    />
  )
}

export default SafeManagementPolicyFlow
