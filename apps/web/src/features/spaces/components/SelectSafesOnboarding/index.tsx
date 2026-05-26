import { useMemo, type ReactElement } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2 } from 'lucide-react'
import {
  OnboardingLayout,
  StepCounter,
  SpaceSidePanel,
  deriveSidePanelAccountsFromSpace,
} from '@/features/spaces/components/OnboardingLayout'
import type { SafeAppMockupAccount } from '@/features/spaces/components/OnboardingLayout'
import useWallet from '@/hooks/wallets/useWallet'
import { isMultiChainSafeItem, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import OnboardingSafesList from './components/OnboardingSafesList'
import ConnectWalletPrompt from './components/ConnectWalletPrompt'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import { useSelectAll } from '@/features/spaces/hooks/useSelectAll'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/components/Sidebar/constants'
import { MULTICHAIN_SAFE_KEY_PREFIX } from './constants'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 4
const FORM_ID = 'select-safes-form'

/**
 * Derives a deduplicated list of selected safe accounts (by address) for the mockup side panel.
 * Same Safe on multiple chains appears once. The raw SafeItem is threaded through so the mockup
 * can call useSafeCardData per-row to obtain a live fiatValue.
 */
const deriveSidePanelAccounts = (
  selectedSafes: Record<string, boolean>,
  allSafes: AllSafeItems,
): SafeAppMockupAccount[] => {
  const seen = new Set<string>()
  const accounts: SafeAppMockupAccount[] = []

  for (const [key, isSelected] of Object.entries(selectedSafes)) {
    if (!isSelected) continue
    // Skip multichain parent keys — sub-safe keys carry the real chain:address info
    if (key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX)) continue

    const colonIdx = key.indexOf(':')
    if (colonIdx === -1) continue
    const chainId = key.slice(0, colonIdx)
    const address = key.slice(colonIdx + 1)

    if (seen.has(address.toLowerCase())) continue
    seen.add(address.toLowerCase())

    // Try to find the SafeItem and name from allSafes
    let name: string | undefined
    let safeItem: SafeItem | undefined

    for (const safe of allSafes) {
      if (isMultiChainSafeItem(safe)) {
        if (safe.address.toLowerCase() === address.toLowerCase()) {
          name = safe.name
          safeItem = safe.safes.find((s) => s.chainId === chainId) ?? safe.safes[0]
          break
        }
        const sub = safe.safes.find((s) => s.address.toLowerCase() === address.toLowerCase())
        if (sub) {
          name = sub.name ?? safe.name
          safeItem = sub
          break
        }
      } else {
        if (safe.address.toLowerCase() === address.toLowerCase()) {
          name = safe.name
          safeItem = safe
          break
        }
      }
    }

    accounts.push({ address, name, _safeItem: safeItem })
  }

  return accounts
}

const SelectSafesOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch } = useOnboardingSafes()
  const allSafes = useMemo(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
    allSafes,
  )

  const { control, setValue } = formMethods
  const { trustedSelection, ownedSelection, handleSelectAll, isAtLimit } = useSelectAll({
    visibleTrusted: trustedSafes,
    visibleOwned: ownedSafes,
    control,
    setValue,
  })

  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()

  // Watch selected safes to derive real account rows for the mockup side panel.
  // Until useOnboardingSubmit's init effect resets the form with the persisted Space safes
  // (form starts at `{selectedSafes: {}}`), fall back to spaceSafes so the mockup stays
  // populated when the user navigates back from a later step.
  const selectedSafes = useWatch({ control, name: 'selectedSafes' })

  // Build a quick address → name lookup from the user's trusted + owned safes, since
  // spaceSafes (from useSpaceSafes) only carry names the user manually set in the
  // Space address book and are usually empty for freshly-added safes.
  const nameByAddress = useMemo(() => {
    const map = new Map<string, string>()
    const add = (address: string, name: string | undefined) => {
      if (name && !map.has(address.toLowerCase())) map.set(address.toLowerCase(), name)
    }
    for (const safe of allSafes) {
      if (isMultiChainSafeItem(safe)) {
        add(safe.address, safe.name)
        for (const sub of safe.safes) add(sub.address, sub.name ?? safe.name)
      } else {
        add(safe.address, safe.name)
      }
    }
    return map
  }, [allSafes])

  const sidePanelAccounts = useMemo(() => {
    const isFormInitialized = Object.keys(selectedSafes ?? {}).length > 0
    if (isFormInitialized) {
      return deriveSidePanelAccounts(selectedSafes ?? {}, allSafes)
    }
    // Fallback: cross-reference spaceSafes against the trusted/owned name map
    // so the mockup shows "Positive Ethereum Safe" rather than an empty name.
    return deriveSidePanelAccountsFromSpace(spaceSafes).map((a) => ({
      ...a,
      name: a.name?.trim() || nameByAddress.get(a.address.toLowerCase()),
    }))
  }, [selectedSafes, allSafes, spaceSafes, nameByAddress])

  const main = (
    <FormProvider {...formMethods}>
      <form id={FORM_ID} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-6 h-full">
        <StepCounter currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

        <div className="flex flex-col gap-2 shrink-0">
          <Typography variant="h2">Select Safes</Typography>
          <Typography variant="paragraph" color="muted">
            Choose which Safes to add to this Space. You can add more later.
          </Typography>
        </div>

        {wallet ? (
          <>
            <InputGroup className="bg-card px-2 shrink-0">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search for safes"
                aria-label="Search Safe list"
                autoComplete="off"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </InputGroup>

            <div
              className="relative min-h-0 min-w-0 flex-1 overflow-hidden after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:z-10 after:h-16 after:bg-gradient-to-t after:from-muted after:to-transparent"
              data-testid="onboarding-safes-list-scroll-region"
            >
              {isAtLimit && (
                <Typography variant="paragraph" color="muted" className="text-xs pb-1">
                  Limit of {SAFE_ACCOUNTS_LIMIT} accounts reached
                </Typography>
              )}
              <OnboardingSafesList
                trustedSafes={trustedSafes}
                ownedSafes={ownedSafes}
                similarAddresses={similarAddresses}
                trustedSelectAll={{
                  state: trustedSelection.state,
                  count: trustedSelection.selectedCount,
                  total: trustedSelection.total,
                  onToggle: (check) => handleSelectAll('trusted', check),
                }}
                ownedSelectAll={{
                  state: ownedSelection.state,
                  count: ownedSelection.selectedCount,
                  total: ownedSelection.total,
                  onToggle: (check) => handleSelectAll('owned', check),
                }}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="shrink-0">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <ConnectWalletPrompt testId="select-safes-connect-wallet-button" />
            <Button
              data-testid="select-safes-skip-button"
              type="button"
              variant="secondary"
              onClick={handleSkip}
              className="w-full max-w-[300px] h-12 rounded-lg hover:bg-card"
            >
              Skip
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )

  const footer = wallet ? (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isSubmitting}
        className="flex-1 h-12 rounded-lg"
      >
        <ChevronLeft className="size-4 mr-1" />
        Back
      </Button>
      <Button
        data-testid="select-safes-continue-button"
        type="submit"
        form={FORM_ID}
        disabled={selectedSafesLength === 0 || isSubmitting}
        className="flex-1 h-12 rounded-lg text-[15px]"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Next'}
      </Button>
    </div>
  ) : undefined

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={<SpaceSidePanel name={space?.name ?? ''} highlight="accounts" accounts={sidePanelAccounts} />}
    />
  )
}

export default SelectSafesOnboarding
