import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  Paper,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import { type AllSafeItems, flattenSafeItems, getComparator, useOwnedSafesGrouped, useSafesSearch } from '@/hooks/safes'
import SafesList from '@/features/spaces/components/AddAccounts/SafesList'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import SearchIcon from '@/public/images/common/search.svg'
import SpaceIcon from '@/public/images/spaces/space.svg'
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
import css from '@/features/spaces/components/AddAccounts/styles.module.css'

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

  // Ensure lastUsedSpace is in sync with the query param
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

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!wallet || !isUserAuthenticated) {
      router.replace({ pathname: AppRoutes.welcome.index })
    }
  }, [wallet, isUserAuthenticated, router])

  // Redirect to create-space if no spaceId
  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }, [router, spaceId])

  const redirectToSpaceDashboard = useCallback(() => {
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
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={3}>
      <Paper sx={{ maxWidth: 500, width: '100%', p: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} mb={1}>
          Select Safes for your Space
          <SvgIcon
            component={SpaceIcon}
            inheritViewBox
            sx={{ fill: 'none', fontSize: 32, ml: 1, verticalAlign: 'middle' }}
          />
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Consolidate and organize safes, members and transaction activity.
        </Typography>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <FormProvider {...formMethods}>
            <form onSubmit={onSubmit}>
              <Box m={2}>
                <TextField
                  id="search-safes"
                  placeholder="Search for safes"
                  aria-label="Search Safe list"
                  variant="filled"
                  hiddenLabel
                  onChange={(e) => handleSearch(e.target.value)}
                  className={css.search}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon
                          component={SearchIcon}
                          inheritViewBox
                          fontWeight="bold"
                          fontSize="small"
                          sx={{
                            color: 'var(--color-border-main)',
                            '.MuiInputBase-root.Mui-focused &': { color: 'var(--color-text-primary)' },
                          }}
                        />
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                  }}
                  fullWidth
                  size="small"
                />
              </Box>

              {searchQuery ? <SafesList safes={filteredSafes} /> : <SafesList safes={allSafes} />}

              {error && (
                <Alert severity="error" sx={{ m: 2, mt: 0 }}>
                  {error}
                </Alert>
              )}

              <Box px={2} pb={2} display="flex" flexDirection="column" gap={1}>
                <Button
                  data-testid="select-safes-continue-button"
                  type="submit"
                  variant="contained"
                  disabled={selectedSafesLength === 0 || isSubmitting}
                  disableElevation
                  fullWidth
                  sx={{ minHeight: '42px' }}
                >
                  {isSubmitting ? <CircularProgress size={20} /> : 'Continue'}
                </Button>

                <Button
                  data-testid="select-safes-skip-button"
                  onClick={redirectToSpaceDashboard}
                  disabled={isSubmitting}
                  fullWidth
                  sx={{ minHeight: '42px' }}
                >
                  Skip
                </Button>
              </Box>
            </form>
          </FormProvider>
        </Card>
      </Paper>
    </Box>
  )
}

export default SelectSafesOnboarding
