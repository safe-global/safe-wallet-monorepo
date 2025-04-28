import ModalDialog from '@/components/common/ModalDialog'
import type { SafeItem, SafeItems } from '@/features/myAccounts/hooks/useAllSafes'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import AddManually, { type AddManuallyFormValues } from '@/features/spaces/components/AddAccounts/AddManually'
import SafesList, { getSafeId } from '@/features/spaces/components/AddAccounts/SafesList'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import SearchIcon from '@/public/images/common/search.svg'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

import debounce from 'lodash/debounce'
import css from './styles.module.css'
import {
  type AllSafeItems,
  flattenSafeItems,
  useOwnedSafesGrouped,
} from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  DialogActions,
  DialogContent,
  InputAdornment,
  SvgIcon,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { showNotification } from '@/store/notificationsSlice'

export type AddAccountsFormValues = {
  selectedSafes: Record<string, boolean>
}

function getSelectedSafes(safes: AddAccountsFormValues['selectedSafes'], spaceSafes: AllSafeItems) {
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

const SAFE_ACCOUNTS_LIMIT = 10

const AddAccounts = () => {
  const isAdmin = useIsAdmin()
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string>()
  const [manualSafes, setManualSafes] = useState<SafeItems>([])

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const dispatch = useAppDispatch()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const safes = useOwnedSafesGrouped()
  const sortComparator = getComparator(orderBy)
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()
  const spaceId = useCurrentSpaceId()

  const allSafes = useMemo<AllSafeItems>(
    () => [...manualSafes, ...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [manualSafes, safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
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

  const { handleSubmit, watch, setValue } = formMethods

  const selectedSafes = watch(`selectedSafes`)
  const selectedSafesLength = getSelectedSafes(selectedSafes, spaceSafes).length

  const onSubmit = handleSubmit(async (data) => {
    trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNTS })
    const safesToAdd = getSelectedSafes(data.selectedSafes, spaceSafes).map(([key]) => {
      const [chainId, address] = key.split(':')
      return { chainId, address }
    })

    try {
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
          message: `Added safe account(s) to space`,
          variant: 'success',
          groupKey: 'add-safe-account-success',
        }),
      )

      handleClose()
    } catch (e) {
      console.log(e)
    }
  })

  const handleAddSafe = (data: AddManuallyFormValues) => {
    const alreadyExists = allSafes.some((safe) => safe.address === data.address)

    const newSafeItem: SafeItem = {
      ...data,
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: '',
    }

    if (!alreadyExists) {
      setManualSafes((prev) => [newSafeItem, ...prev])
    }

    const safeId = getSafeId(newSafeItem)
    setValue(`selectedSafes.${safeId}`, true, { shouldValidate: true })
  }

  const handleClose = () => {
    setError(undefined)
    setSearchQuery('')
    setValue('selectedSafes', {}) // Reset doesn't seem to work consistently with an object
    setOpen(false)
  }

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.add_accounts_modal })
    }
  }, [searchQuery])

  return (
    <>
      <Tooltip title={!isAdmin ? 'You need to be an Admin to add accounts' : ''} placement="top">
        <Box component="span">
          <Button
            data-testid="add-space-account-button"
            variant="contained"
            onClick={() => setOpen(true)}
            disabled={!isAdmin}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add accounts
          </Button>
        </Box>
      </Tooltip>

      <ModalDialog
        open={open}
        fullScreen
        hideChainIndicator
        PaperProps={{ sx: { backgroundColor: 'border.background' } }}
      >
        <DialogContent sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Container fixed maxWidth="sm" disableGutters>
            <Typography component="div" variant="h1" mb={1}>
              Add Safe Accounts
            </Typography>
            <Typography mb={2}>
              You can add any Safe Account to your Space. This is currently limited to {SAFE_ACCOUNTS_LIMIT} Safe
              Accounts.
            </Typography>
            <Card>
              <FormProvider {...formMethods}>
                <form onSubmit={onSubmit}>
                  <Box m={2}>
                    <TextField
                      id="search-by-name"
                      placeholder="Search"
                      aria-label="Search Safe list by name"
                      variant="filled"
                      hiddenLabel
                      onChange={(e) => {
                        handleSearch(e.target.value)
                      }}
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

                  <Box p={2}>
                    <Track {...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>
                      <AddManually handleAddSafe={handleAddSafe} />
                    </Track>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ m: 2, mt: 0 }}>
                      {error}
                    </Alert>
                  )}

                  <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                      data-testid="add-accounts-button"
                      variant="contained"
                      disabled={selectedSafesLength === 0}
                      type="submit"
                    >
                      Add Accounts ({selectedSafesLength})
                    </Button>
                  </DialogActions>
                </form>
              </FormProvider>
            </Card>
          </Container>
        </DialogContent>
      </ModalDialog>
    </>
  )
}

export default AddAccounts
