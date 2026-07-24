import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Box, Stack, Typography } from '@mui/material'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { TokenInfo, AvailablePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { Coins, Plus } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useSpaceSafes } from '@/features/spaces'
import { SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { Button } from '@/components/ui/button'
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
import { TokenSelector } from '../shared/TokenSelector'
import { AddressSelectorList, type AddressEntry } from '../shared/AddressSelectorList'
import { usePolicyGuard } from '../hooks/usePolicyGuard'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'
import { savePolicyRequestApi } from '../policyRequestStore'
import { POLICY_GUARD_DELAY_SEC } from '../shared/guardTx'
import { tokensForChain } from '../SpendingLimitFlow/tokenList'
import { buildTokenWithdrawBatch, type TokenAllowlist } from './buildBatch'

const STEPS = [
  { key: 'apply-to', label: 'Select Safe' },
  { key: 'tokens', label: 'Select Tokens' },
  { key: 'recipients', label: 'Recipients' },
  { key: 'review', label: 'Review' },
] as const
type StepKey = (typeof STEPS)[number]['key']

/** The token-withdraw AvailablePolicy for the selected safe, carrying the contract addresses. */
const useWithdrawPolicyContracts = (chainId: string, safeAddress: string) => {
  const { policies } = useAvailablePolicies(chainId, safeAddress)
  return useMemo(() => policies.find((p: AvailablePolicy) => p.type === PolicyType.TokenWithdraw), [policies])
}

const ERC20TransferPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState('')
  const [selectedTokens, setSelectedTokens] = useState<TokenInfo[]>([])
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([])
  const [customTokenInput, setCustomTokenInput] = useState('')
  const [recipients, setRecipients] = useState<AddressEntry[]>([])

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const available = useWithdrawPolicyContracts(chainId, safeAddress)
  const guardAddress =
    available?.enforcement.via === 'guard' ? available.enforcement.guards.transactionGuard?.safePolicyGuard : undefined
  const policyContract =
    available?.enforcement.via === 'guard' ? available.enforcement.guards.transactionGuard?.policyContract : undefined

  const { currentGuard, isSet: isGuardSet, isUnknownGuard } = usePolicyGuard(chainId, safeAddress, guardAddress)

  // Tokens the Safe holds, plus a chain-default fallback.
  const { data: balances } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress, fiatCode: 'USD', trusted: true, excludeSpam: true },
    { skip: !chainId || !safeAddress },
  )
  const [fallback = []] = useAsync(() => (chainId ? tokensForChain(chainId) : undefined), [chainId])
  const tokenOptions = useMemo<TokenInfo[]>(() => {
    const held: TokenInfo[] = (balances?.items ?? []).map((b) => ({
      address: b.tokenInfo.address,
      symbol: b.tokenInfo.symbol,
      decimals: b.tokenInfo.decimals,
      logoUri: b.tokenInfo.logoUri,
    }))
    const merged = [...customTokens, ...held]
    const seen = new Set(merged.map((t) => t.address.toLowerCase()))
    const extra: TokenInfo[] = fallback
      .filter((t) => !seen.has(t.address.toLowerCase()))
      .map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals, logoUri: t.logoURI ?? null }))
    return [...merged, ...extra]
  }, [balances?.items, fallback, customTokens])

  const customTokenTrimmed = customTokenInput.trim()
  const isCustomTokenValid = isAddress(customTokenTrimmed)
  const isCustomTokenKnown =
    isCustomTokenValid && tokenOptions.some((t) => t.address.toLowerCase() === customTokenTrimmed.toLowerCase())

  const addCustomToken = () => {
    if (!isCustomTokenValid || isCustomTokenKnown) return
    const address = getAddress(customTokenTrimmed)
    const token: TokenInfo = { address, symbol: shortenAddress(address), decimals: 18, logoUri: null }
    setCustomTokens((prev) => [token, ...prev])
    setSelectedTokens((prev) => [...prev, token])
    setCustomTokenInput('')
  }

  const { setTxFlow } = useContext(TxModalContext)

  const validRecipients = recipients.filter((r) => isAddress(r.address))

  const continueDisabled = (() => {
    const step = STEPS[stepIndex].key as StepKey
    if (step === 'apply-to') return !selectedSafe
    if (step === 'tokens') return selectedTokens.length === 0
    if (step === 'recipients') return validRecipients.length === 0
    return false
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

    // All selected tokens share the current recipient list (allowed: true).
    const allowlist: TokenAllowlist[] = selectedTokens.map((token) => ({
      token: token.address as Address,
      recipients: validRecipients.map((r) => ({ address: r.address as Address, allowed: true })),
    }))

    const { txs, mode, configurations, configureRoot } = buildTokenWithdrawBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      allowlist,
      allowOverwriteGuard: isUnknownGuard, // Review surfaces the warning; the user has seen it.
    })

    // Guard already active → this only REQUESTS the change; it applies after the
    // on-chain delay via a separate applyConfiguration tx.
    const isRequest = mode === 'request'
    const subtitle = isRequest ? 'Request token withdraw change' : 'Token withdraw allowlist'

    // Snapshot the requested change so the Pending section can offer Apply once
    // the delay has elapsed. Persisted only when the request tx is submitted.
    const onSubmit = isRequest
      ? () => {
          const requestedAt = Math.floor(Date.now() / 1000)
          savePolicyRequestApi.save({
            id: configureRoot,
            chainId,
            safeAddress,
            type: PolicyType.TokenWithdraw,
            enforcement: {
              via: 'guard',
              guards: { transactionGuard: { policyContract, safePolicyGuard: guardAddress } },
            },
            data: {
              allowlist: selectedTokens.map((token) => ({
                token,
                recipients: validRecipients.map((r) => ({ address: r.address, name: r.name ?? null })),
              })),
            },
            configurations,
            configureRoot,
            requestedAt,
            readyAt: requestedAt + POLICY_GUARD_DELAY_SEC,
            delaySec: POLICY_GUARD_DELAY_SEC,
          })
        }
      : undefined

    // Switch the URL's active Safe right before handing off — the tx-flow modal
    // reads it via useSafeInfo (and useInitSafeCoreSDK sets up the SDK). This is
    // the ONLY time we touch the global active-safe state; shallow keeps us on
    // the Policies page.
    const chain = chains.find((c) => c.chainId === chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safeAddress}` } },
        undefined,
        { shallow: true },
      )
    }

    setTxFlow(<PolicyBatchFlow txs={txs} subtitle={subtitle} onSubmit={onSubmit} />)
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

          {step === 'tokens' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Which tokens can be withdrawn?
              </Typography>

              {/* Custom token by contract address — first, so it's the obvious way to add any token */}
              <Stack gap={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                  Add a token by contract address
                </Typography>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <WizardField
                      icon={<Coins size={16} color="#737373" />}
                      value={customTokenInput}
                      onChange={setCustomTokenInput}
                      placeholder="0x… token contract address"
                      state={customTokenTrimmed === '' ? 'default' : isCustomTokenValid ? 'valid' : 'error'}
                      ariaLabel="Custom token address"
                    />
                  </Box>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomToken}
                    disabled={!isCustomTokenValid || isCustomTokenKnown}
                    className="shrink-0"
                  >
                    <Plus size={16} /> Add token
                  </Button>
                </Stack>
              </Stack>

              {tokenOptions.length > 0 && (
                <Stack gap={1}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                    Or pick from this Safe’s tokens
                  </Typography>
                  <TokenSelector tokens={tokenOptions} selected={selectedTokens} onChange={setSelectedTokens} />
                </Stack>
              )}
            </Stack>
          )}

          {step === 'recipients' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Which addresses can receive these tokens?
              </Typography>
              <AddressSelectorList addresses={recipients} onChange={setRecipients} entryLabel="recipient" />
            </Stack>
          )}

          {step === 'review' && (
            <Stack gap={2}>
              <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
                Review
              </Typography>

              {isUnknownGuard && (
                <Alert severity="warning">
                  This Safe already has a different transaction guard. Continuing will overwrite it.
                </Alert>
              )}

              {isGuardSet && (
                <Alert severity="info">
                  This Safe already has the policy guard, so this change is time-locked. You’ll request it now and apply
                  it after the guard’s delay has passed.
                </Alert>
              )}

              <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', px: 2, py: 1 }}>
                {/* Safe */}
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

                {/* Tokens — all selected tokens together */}
                <PolicySummaryRow
                  label={selectedTokens.length === 1 ? 'Token' : 'Tokens'}
                  value={
                    <Stack gap={0.75}>
                      {selectedTokens.map((token) => (
                        <Stack key={token.address} direction="row" alignItems="center" gap={1}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{token.symbol}</Typography>
                          <Typography
                            sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
                          >
                            {shortenAddress(token.address)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  }
                />

                {/* Recipients — the allowlist that applies to all the tokens above */}
                <PolicySummaryRow
                  label={validRecipients.length === 1 ? 'Recipient' : 'Recipients'}
                  value={
                    <Stack gap={0.75}>
                      {validRecipients.map((r) => (
                        <Stack key={r.address} direction="row" alignItems="center" gap={1}>
                          <SafeIdenticon address={r.address} size={16} />
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {r.name || shortenAddress(r.address)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
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

export default ERC20TransferPolicyFlow
