import ModalDialog from '@/components/common/ModalDialog'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import FilteredSafesList from '@/features/organizations/components/AddAccounts/FilteredSafesList'
import SafesList from '@/features/organizations/components/AddAccounts/SafesList'
import SearchIcon from '@/public/images/common/search.svg'
import debounce from 'lodash/debounce'
import css from './styles.module.css'
import { type AllSafeItems, useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  Box,
  Button,
  Card,
  Container,
  DialogActions,
  DialogContent,
  InputAdornment,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

export type AddAccountsFormValues = {
  selectedSafes: Record<string, boolean>
}

const AddAccounts = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const safes = useAllSafesGrouped()
  const sortComparator = getComparator(orderBy)

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

  const selectedSafes = watch(`selectedSafes`)
  const selectedSafesLength = Object.values(selectedSafes).filter(Boolean).length

  const onSubmit = handleSubmit((data) => {
    // TODO: Submit data to safe list endpoint
    console.log(data)
  })

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Add accounts
      </Button>
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

                  {searchQuery ? <FilteredSafesList filteredSafes={filteredSafes} /> : <SafesList safes={allSafes} />}

                  <Box p={2}>
                    <Button size="compact">+ Add manually</Button>
                  </Box>
                </form>
              </FormProvider>
              <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained">Add Accounts ({selectedSafesLength})</Button>
              </DialogActions>
            </Card>
          </Container>
        </DialogContent>
      </ModalDialog>
    </>
  )
}

export default AddAccounts
