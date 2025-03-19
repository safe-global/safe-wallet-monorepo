import ModalDialog from '@/components/common/ModalDialog'
import type { SafeItem, SafeItems } from '@/features/myAccounts/hooks/useAllSafes'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import AddManually, { type AddManuallyFormValues } from '@/features/organizations/components/AddAccounts/AddManually'
import SafesList, { getSafeId } from '@/features/organizations/components/AddAccounts/SafesList'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import SearchIcon from '@/public/images/common/search.svg'
import { useOrganizationSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import debounce from 'lodash/debounce'
import css from './styles.module.css'
import { type AllSafeItems, useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useAppSelector } from '@/store'
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
import { ORG_EVENTS, ORG_LABELS } from '@/services/analytics/events/organizations'
import Track from '@/components/common/Track'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'

export type AddAccountsFormValues = {
  selectedSafes: Record<string, boolean>
}

function getSelectedSafes(safes: AddAccountsFormValues['selectedSafes']) {
  return Object.entries(safes).filter(([address, isSelected]) => isSelected && !address.startsWith('multichain_'))
}

const AddAccounts = () => {
  const isAdmin = useIsAdmin()
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string>()
  const [manualSafes, setManualSafes] = useState<SafeItems>([])

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const safes = useAllSafesGrouped()
  const sortComparator = getComparator(orderBy)
  const [addSafesToOrg] = useOrganizationSafesCreateV1Mutation()
  const orgId = useCurrentOrgId()

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
  const selectedSafesLength = getSelectedSafes(selectedSafes).length

  const onSubmit = handleSubmit(async (data) => {
    trackEvent({ ...ORG_EVENTS.ADD_ACCOUNTS })
    const safesToAdd = getSelectedSafes(data.selectedSafes).map(([key]) => {
      const [chainId, address] = key.split(':')
      return { chainId, address }
    })

    try {
      const result = await addSafesToOrg({
        organizationId: Number(orgId),
        createOrganizationSafesDto: { safes: safesToAdd },
      })

      if (result.error) {
        // TODO: Add error handler and display more specific error
        setError('Something went wrong adding one or more Safe Accounts')
        return
      }

      handleClose()
    } catch (e) {
      console.log(e)
    }
  })

  const handleAddSafe = (data: AddManuallyFormValues) => {
    const alreadyExists = manualSafes.some((safe) => safe.address === data.address && safe.chainId === data.chainId)

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
    setSearchQuery('')
    setValue('selectedSafes', {}) // Reset doesn't seem to work consistently with an object
    setOpen(false)
  }

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ ...ORG_EVENTS.SEARCH_ACCOUNTS, label: ORG_LABELS.add_accounts_modal })
    }
  }, [searchQuery])

  return (
    <>
      <Tooltip title={!isAdmin ? 'You need to be an Admin to add accounts' : ''} placement="top">
        <Box component="span">
          <Button variant="contained" onClick={() => setOpen(true)} disabled={!isAdmin}>
            Add accounts
          </Button>
        </Box>
      </Tooltip>

      <ModalDialog open={open} fullScreen hideChainIndicator PaperProps={{ sx: { backgroundColor: '#f4f4f4' } }}>
        <DialogContent sx={{ display: 'flex', alignItems: 'center' }}>
          <Container fixed maxWidth="sm" disableGutters>
            <Typography component="div" variant="h1" mb={1}>
              Add Safe Accounts
            </Typography>
            <Typography mb={2}>
              You can add Safe Account which you are a signer of, or add any read-only account.
            </Typography>
            <Card>
              <FormProvider {...formMethods}>
                <form onSubmit={onSubmit}>
                  <Box mt={2} mx={2}>
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
                    <Track {...ORG_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>
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
                    <Button variant="contained" disabled={selectedSafesLength === 0} type="submit">
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
