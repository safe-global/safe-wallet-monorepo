import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import { ChainIcon } from '@/components/common/SafeIcon'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { MultichainIndicator } from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import {
  type AllSafeItems,
  flattenSafeItems,
  type MultiChainSafeItem,
} from '@/features/myAccounts/hooks/useAllSafesGrouped'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import css from '@/features/spaces/components/AddAccounts/styles.module.css'
import { useChain } from '@/hooks/useChains'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { Controller, useFormContext } from 'react-hook-form'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import isEqual from 'lodash/isEqual'

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

export const getSafeId = (safeItem: SafeItem) => {
  return `${safeItem.chainId}:${safeItem.address}`
}

function getMultiChainSafeId(mcSafe: MultiChainSafeItem) {
  return `multichain_${mcSafe.address}`
}

const SafesList = ({ safes }: { safes: AllSafeItems }) => {
  const { watch, setValue, control } = useFormContext<AddAccountsFormValues>()
  const { allSafes: spaceSafes } = useSpaceSafes()
  const flatSafeItems = flattenSafeItems(spaceSafes)
  const multiChainSpaceSafes = spaceSafes.filter(isMultiChainSafeItem)

  return (
    <List
      sx={{
        px: 2,
        pb: 2,
        pt: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxHeight: 400,
        minHeight: 400,
        overflow: 'auto',
      }}
    >
      {safes.map((safe, index) => {
        if (isMultiChainSafeItem(safe)) {
          const parentSafeId = getMultiChainSafeId(safe)
          const subSafeIds = safe.safes.map(getSafeId)
          const watchedSubSafeIds = subSafeIds.map((id) => `selectedSafes.${id}`)

          // @ts-ignore TODO: Check why this overload is not supported https://react-hook-form.com/docs/useform/watch
          const subSafeValues = watch(watchedSubSafeIds)

          const totalSubSafes = safe.safes.length
          const checkedCount = subSafeValues.filter(Boolean).length
          const allChecked = checkedCount === totalSubSafes && totalSubSafes > 0
          const someChecked = checkedCount > 0 && checkedCount < totalSubSafes
          const alreadyAdded = multiChainSpaceSafes.some((spaceSafe) => isEqual(spaceSafe.safes, safe.safes))

          const handleHeaderCheckboxChange = (checked: boolean) => {
            setValue(`selectedSafes.${parentSafeId}`, checked, { shouldValidate: true })

            subSafeIds.forEach((id) => {
              setValue(`selectedSafes.${id}`, checked, { shouldValidate: true })
            })
          }

          return (
            <Accordion key={index} className={css.accordion} disableGutters sx={{ flexShrink: '0' }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-expandIconWrapper': { position: 'absolute', right: '16px' },
                }}
              >
                <Checkbox
                  checked={Boolean(allChecked) || alreadyAdded}
                  indeterminate={someChecked}
                  onChange={(e) => handleHeaderCheckboxChange(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  sx={{ mr: 2 }}
                  disabled={alreadyAdded}
                />
                <Box className={css.safeRow}>
                  <EthHashInfo address={safe.address} copyAddress={false} showPrefix={false} />
                  <Box sx={{ justifySelf: 'flex-start' }}>
                    <MultichainIndicator safes={safe.safes} />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <List disablePadding>
                  {safe.safes.map((subSafe) => {
                    const subSafeId = getSafeId(subSafe)
                    const alreadyAdded = flatSafeItems.some((spaceSafe) => {
                      return spaceSafe.chainId === subSafe.chainId && spaceSafe.address === subSafe.address
                    })

                    return (
                      <Controller
                        key={`${subSafeId}`}
                        name={`selectedSafes.${subSafeId}`}
                        control={control}
                        render={({ field }) => {
                          const handleItemClick = () => {
                            field.onChange(!field.value)
                          }

                          return (
                            <ListItem disablePadding>
                              <ListItemButton onClick={handleItemClick} disabled={alreadyAdded}>
                                <ListItemIcon onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={Boolean(field.value) || alreadyAdded}
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
                    )
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          )
        }

        const safeId = getSafeId(safe)
        const alreadyAdded = flatSafeItems.some(
          (spaceSafe) => spaceSafe.address === safe.address && spaceSafe.chainId === safe.chainId,
        )

        return (
          <Controller
            key={`${safeId}`}
            name={`selectedSafes.${safeId}`}
            control={control}
            render={({ field }) => {
              const handleItemClick = () => {
                field.onChange(!field.value)
              }

              return (
                <ListItem className={css.safeItem} disablePadding>
                  <ListItemButton onClick={handleItemClick} disabled={alreadyAdded}>
                    <ListItemIcon onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={Boolean(field.value) || alreadyAdded}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box className={css.safeRow}>
                          <EthHashInfo address={safe.address} chainId={safe.chainId} copyAddress={false} />
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
  )
}

export default SafesList
