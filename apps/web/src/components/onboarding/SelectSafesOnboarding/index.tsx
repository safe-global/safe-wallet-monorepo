import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import { FormProvider, useForm, Controller, useFormContext } from 'react-hook-form'
import {
  type AllSafeItems,
  flattenSafeItems,
  getComparator,
  isMultiChainSafeItem,
  useOwnedSafesGrouped,
  useSafesSearch,
  type SafeItem,
  type MultiChainSafeItem,
} from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { isAuthenticated, setLastUsedSpace } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useChain } from '@/hooks/useChains'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { selectCurrency } from '@/store/settingsSlice'
import { useSafeItemData } from '@/features/myAccounts/hooks/useSafeItemData'
import { useMultiAccountItemData } from '@/features/myAccounts/hooks/useMultiAccountItemData'
import { getDeterministicColor } from '@/features/spaces/components/InitialsAvatar'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Users, Loader2 } from 'lucide-react'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 4

const getSafeId = (safeItem: SafeItem) => `${safeItem.chainId}:${safeItem.address}`
const getMultiChainSafeId = (mcSafe: MultiChainSafeItem) => `multichain_${mcSafe.address}`

const getSelectedSafes = (safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) => {
  const flatSafeItems = flattenSafeItems(spaceSafes)

  return Object.entries(safes).filter(
    ([key, isSelected]) =>
      isSelected &&
      !key.startsWith('multichain_') &&
      !flatSafeItems.some((spaceSafe) => {
        const [chainId, address] = key.split(':')
        return spaceSafe.address === address && spaceSafe.chainId === chainId
      }),
  )
}

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`size-1.5 rounded-full ${i + 1 === currentStep ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
      />
    ))}
  </div>
)

const ChainLogo = ({ chainId, size = 24 }: { chainId: string; size?: number }) => {
  const chainConfig = useChain(chainId)

  if (!chainConfig?.chainLogoUri) return null

  return (
    <img
      src={chainConfig.chainLogoUri}
      alt={`${chainConfig.chainName} logo`}
      width={size}
      height={size}
      className="rounded-full border-2 border-background"
      loading="lazy"
    />
  )
}

const SafeAvatar = ({ name, address }: { name: string | undefined; address: string }) => {
  const displayName = name || shortenAddress(address)
  const initial = displayName.charAt(0).toUpperCase()
  const bgColor = getDeterministicColor(displayName)

  return (
    <Avatar>
      <AvatarFallback style={{ backgroundColor: bgColor, color: 'white' }}>{initial}</AvatarFallback>
    </Avatar>
  )
}

const FiatBalance = ({ value }: { value: string | number | undefined }) => {
  const currency = useAppSelector(selectCurrency)

  if (value === undefined) return null

  return <span className="text-sm font-medium text-muted-foreground">{formatCurrency(value, currency)}</span>
}

const ThresholdBadge = ({ threshold, owners }: { threshold: number; owners: number }) => (
  <Badge variant="secondary" className="gap-1">
    <Users className="size-3" />
    {threshold}/{owners}
  </Badge>
)

interface SingleSafeCardProps {
  safe: SafeItem
  alreadyAdded: boolean
}

const SingleSafeCard = ({ safe, alreadyAdded }: SingleSafeCardProps) => {
  const { control } = useFormContext<AddAccountsFormValues>()
  const safeId = getSafeId(safe)
  const { name, threshold, owners, safeOverview, elementRef } = useSafeItemData(safe)

  return (
    <Controller
      name={`selectedSafes.${safeId}`}
      control={control}
      render={({ field }) => {
        const handleToggle = () => {
          if (!alreadyAdded) {
            field.onChange(!field.value)
          }
        }

        return (
          <button
            ref={elementRef as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={handleToggle}
            disabled={alreadyAdded}
            className="flex w-full cursor-pointer items-center gap-2 rounded-3xl bg-card py-4 pl-2 pr-6 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
          >
            <div className="flex shrink-0 items-center px-2">
              <Checkbox
                checked={Boolean(field.value) || alreadyAdded}
                onCheckedChange={(checked) => field.onChange(checked)}
                onClick={(e) => e.stopPropagation()}
                disabled={alreadyAdded}
              />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4">
              <SafeAvatar name={name} address={safe.address} />

              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-base font-medium text-foreground">
                  {name || shortenAddress(safe.address)}
                </span>
                <span className="text-xs text-muted-foreground">{shortenAddress(safe.address)}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <ChainLogo chainId={safe.chainId} />
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <FiatBalance value={safeOverview?.fiatTotal} />
              <ThresholdBadge threshold={threshold} owners={owners.length} />
            </div>
          </button>
        )
      }}
    />
  )
}

interface MultiChainSafeCardProps {
  safe: MultiChainSafeItem
  alreadyAdded: boolean
}

const MultiChainSafeCard = ({ safe, alreadyAdded }: MultiChainSafeCardProps) => {
  const { setValue, watch } = useFormContext<AddAccountsFormValues>()
  const parentSafeId = getMultiChainSafeId(safe)
  const subSafeIds = safe.safes.map(getSafeId)

  const { name, totalFiatValue, sharedSetup, deployedChainIds } = useMultiAccountItemData(safe)

  const watchedSubSafeIds = subSafeIds.map((id) => `selectedSafes.${id}` as const)
  // @ts-ignore TODO: Check why this overload is not supported
  const subSafeValues = watch(watchedSubSafeIds)
  const allChecked = subSafeValues.every(Boolean) && subSafeValues.length > 0

  const handleToggle = () => {
    if (alreadyAdded) return
    const newValue = !allChecked
    setValue(`selectedSafes.${parentSafeId}`, newValue, { shouldValidate: true })
    subSafeIds.forEach((id) => {
      setValue(`selectedSafes.${id}`, newValue, { shouldValidate: true })
    })
  }

  const threshold = sharedSetup?.threshold ?? 0
  const owners = sharedSetup?.owners.length ?? 0

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={alreadyAdded}
      className="flex w-full cursor-pointer items-center gap-2 rounded-3xl bg-card py-4 pl-2 pr-6 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      <div className="flex shrink-0 items-center px-2">
        <Checkbox
          checked={allChecked || alreadyAdded}
          onCheckedChange={() => handleToggle()}
          onClick={(e) => e.stopPropagation()}
          disabled={alreadyAdded}
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SafeAvatar name={name} address={safe.address} />

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-base font-medium text-foreground">{name || shortenAddress(safe.address)}</span>
          <span className="text-xs text-muted-foreground">{shortenAddress(safe.address)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <div className="flex -space-x-2">
          {deployedChainIds.map((chainId) => (
            <ChainLogo key={chainId} chainId={chainId} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <FiatBalance value={totalFiatValue?.toString()} />
        {threshold > 0 && <ThresholdBadge threshold={threshold} owners={owners} />}
      </div>
    </button>
  )
}

interface SafeListProps {
  safes: AllSafeItems
}

const OnboardingSafesList = ({ safes }: SafeListProps) => {
  const { allSafes: spaceSafes } = useSpaceSafes()
  const flatSafeItems = flattenSafeItems(spaceSafes)
  const multiChainSpaceSafes = spaceSafes.filter(isMultiChainSafeItem)

  return (
    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
      {safes.map((safe, index) => {
        if (isMultiChainSafeItem(safe)) {
          const alreadyAdded = multiChainSpaceSafes.some((spaceSafe) =>
            safe.safes.every((s) => spaceSafe.safes.some((ss) => ss.chainId === s.chainId && ss.address === s.address)),
          )
          return <MultiChainSafeCard key={`multi-${safe.address}-${index}`} safe={safe} alreadyAdded={alreadyAdded} />
        }

        const alreadyAdded = flatSafeItems.some(
          (spaceSafe) => spaceSafe.address === safe.address && spaceSafe.chainId === safe.chainId,
        )
        return <SingleSafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} alreadyAdded={alreadyAdded} />
      })}
    </div>
  )
}

const SelectSafesOnboarding = (): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = router.query.spaceId as string | undefined

  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const { allSafes: spaceSafes } = useSpaceSafes()
  const safes = useOwnedSafesGrouped()
  const sortComparator = getComparator(orderBy)
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()

  useEffect(() => {
    if (spaceId) {
      dispatch(setLastUsedSpace(spaceId))
    }
  }, [spaceId, dispatch])

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])
  const filteredSafes = useSafesSearch(allSafes ?? [], searchQuery)

  const formMethods = useForm<AddAccountsFormValues>({
    mode: 'onChange',
    defaultValues: {
      selectedSafes: {},
    },
  })

  const { handleSubmit, watch } = formMethods
  const selectedSafes = watch('selectedSafes')
  const selectedSafesLength = getSelectedSafes(selectedSafes, spaceSafes).length

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }, [router, spaceId])

  const handleBack = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.createSpace })
  }, [router])

  const handleSkip = useCallback(() => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }, [router, spaceId])

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })

      const safesToAdd = getSelectedSafes(data.selectedSafes, spaceSafes).map(([key]) => {
        const [chainId, address] = key.split(':')
        return { chainId, address }
      })

      const result = await addSafesToSpace({
        spaceId: Number(spaceId),
        createSpaceSafesDto: { safes: safesToAdd },
      })

      if (result.error) {
        // @ts-ignore
        setError(result.error?.data?.message || 'Something went wrong adding one or more Safe Accounts.')
        return
      }

      dispatch(
        showNotification({
          message: 'Added Safe Account(s) to space',
          variant: 'success',
          groupKey: 'add-safe-account-success',
        }),
      )

      redirectToNextStep()
    } catch {
      setError('Something went wrong adding Safe Accounts. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!wallet || !isUserAuthenticated || !spaceId) {
    return <></>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit} className="flex w-full max-w-[520px] flex-col gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center justify-center py-xs">
            <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />
          </div>

          <h2 className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            Select Safes for your Space
          </h2>

          <p className="text-center text-base leading-6 text-muted-foreground w-[93%] mx-auto">
            Consolidate and organize safes, members and transaction activity.
          </p>

          <InputGroup className="bg-card px-2">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search for safes"
              aria-label="Search Safe list"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>

          <OnboardingSafesList safes={searchQuery ? filteredSafes : allSafes} />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            data-testid="select-safes-continue-button"
            type="submit"
            size="lg"
            disabled={selectedSafesLength === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
          </Button>

          <Button
            data-testid="select-safes-skip-button"
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full"
          >
            Skip
          </Button>
        </form>
      </FormProvider>
    </div>
  )
}

export default SelectSafesOnboarding
