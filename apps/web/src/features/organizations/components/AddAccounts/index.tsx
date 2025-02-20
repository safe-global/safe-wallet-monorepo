import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import ModalDialog from '@/components/common/ModalDialog'
import { ChainIcon } from '@/components/common/SafeIcon'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { MultichainIndicator } from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import css from './styles.module.css'
import { type AllSafeItems, useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { getComparator } from '@/features/myAccounts/utils/utils'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { useMemo, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'

type FormValues = {
  selectedSafes: boolean[]
  selectedMultiChainSafes: boolean[][]
}

const ChainItem = ({ chainId }: { chainId: string }) => {
  const chainConfig = useChain(chainId)

  if (!chainConfig) return null

  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <ChainIcon chainId={chainId} />
      <Typography
        component="span"
        sx={{
          color: 'var(--color-primary-light)',
          fontSize: 'inherit',
        }}
      >
        {chainConfig.chainName}
      </Typography>
    </Stack>
  )
}

const AddAccounts = () => {
  const [open, setOpen] = useState<boolean>(false)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const safes = useAllSafesGrouped()
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  // Initialize the form
  const formMethods = useForm<FormValues>({
    defaultValues: {
      selectedSafes: safes.allSingleSafes?.map(() => false),
      selectedMultiChainSafes: safes.allMultiChainSafes?.map((safe) => safe.safes.map(() => false)),
    },
  })

  const { control, handleSubmit, watch, setValue } = formMethods

  const selectedSafes = watch(`selectedSafes`)
  const selectedMultiSafes = watch('selectedMultiChainSafes')
  const selectedSafesLength = selectedSafes.filter((selected) => selected).length
  const selectedMultiSafesLength = selectedMultiSafes.flat().filter((selected) => selected).length

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
                  <List
                    sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}
                  >
                    {allSafes.map((safe, index) => {
                      if (isMultiChainSafeItem(safe)) {
                        const subSafeChecks = watch(`selectedMultiChainSafes.${index}`, [])

                        // If user has N sub-safes:
                        const totalSubSafes = safe.safes.length
                        const checkedCount = subSafeChecks.filter(Boolean).length
                        const allChecked = checkedCount === totalSubSafes && totalSubSafes > 0
                        const someChecked = checkedCount > 0 && checkedCount < totalSubSafes

                        // Handler for the "Select All" checkbox in the header
                        const handleHeaderCheckboxChange = (checked: boolean) => {
                          // Create a new array with all sub-safes set to `checked`
                          const newSubSafeChecks = Array(totalSubSafes).fill(checked)
                          setValue(`selectedMultiChainSafes.${index}`, newSubSafeChecks, {
                            shouldValidate: true,
                          })
                        }

                        return (
                          <Accordion key={index} disableGutters sx={{ flexShrink: '0' }}>
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                '& .MuiAccordionSummary-expandIconWrapper': { position: 'absolute', right: '16px' },
                              }}
                            >
                              <Checkbox
                                checked={Boolean(allChecked)}
                                indeterminate={someChecked}
                                onChange={(e) => handleHeaderCheckboxChange(e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                sx={{ mr: 2 }}
                              />
                              <Box className={css.safeRow}>
                                <EthHashInfo address={safe.address} copyAddress={false} />
                                <Box sx={{ justifySelf: 'flex-start' }}>
                                  <MultichainIndicator safes={safe.safes} />
                                </Box>
                              </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ p: 0 }}>
                              <List disablePadding>
                                {safe.safes.map((subSafe, subIndex) => (
                                  <Controller
                                    key={`${subSafe}-${index}-${subIndex}`}
                                    name={`selectedMultiChainSafes.${index}.${subIndex}`}
                                    control={control}
                                    render={({ field }) => {
                                      const handleItemClick = () => {
                                        field.onChange(!field.value)
                                      }

                                      return (
                                        <ListItem disablePadding>
                                          <ListItemButton onClick={handleItemClick}>
                                            <ListItemIcon onClick={(e) => e.stopPropagation()}>
                                              <Checkbox
                                                checked={Boolean(field.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.stopPropagation()}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                              />
                                            </ListItemIcon>
                                            <ListItemText primary={<ChainItem chainId={subSafe.chainId} />} />
                                          </ListItemButton>
                                        </ListItem>
                                      )
                                    }}
                                  />
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        )
                      }

                      return (
                        <Controller
                          key={`${safe.address}-${index}`}
                          name={`selectedSafes.${index}`}
                          control={control}
                          render={({ field }) => {
                            const handleItemClick = () => {
                              field.onChange(!field.value)
                            }

                            return (
                              <ListItem disablePadding sx={{ border: '1px solid #ddd', borderRadius: '6px' }}>
                                <ListItemButton onClick={handleItemClick}>
                                  <ListItemIcon onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={Boolean(field.value)}
                                      onChange={(event) => field.onChange(event.target.checked)}
                                    />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box className={css.safeRow}>
                                        <EthHashInfo
                                          address={safe.address}
                                          chainId={safe.chainId}
                                          copyAddress={false}
                                        />
                                        <ChainIndicator chainId={safe.chainId} responsive onlyLogo />
                                      </Box>
                                    }
                                  />
                                </ListItemButton>
                              </ListItem>
                            )
                          }}
                        />
                      )
                    })}
                  </List>
                  <Box p={2}>
                    <Button size="compact">+ Add manually</Button>
                  </Box>
                </form>
              </FormProvider>
              <DialogActions>
                <Button>Cancel</Button>
                <Button variant="contained">Add Accounts ({selectedSafesLength + selectedMultiSafesLength})</Button>
              </DialogActions>
            </Card>
          </Container>
        </DialogContent>
      </ModalDialog>
    </>
  )
}

export default AddAccounts
