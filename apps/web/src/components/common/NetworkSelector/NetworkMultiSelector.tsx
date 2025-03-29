import useChains, { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCallback, useEffect, type ReactElement } from 'react'
import { Checkbox, Autocomplete, TextField, Chip, Box } from '@mui/material'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import ChainIndicator from '../ChainIndicator'
import css from './styles.module.css'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useRouter } from 'next/router'
import { getNetworkLink } from '.'
import { SetNameStepFields } from '@/components/new-safe/create/steps/SetNameStep'
import { getSafeSingletonDeployments, getSafeToL2SetupDeployments } from '@safe-global/safe-deployments'
import { hasCanonicalDeployment } from '@safe-global/utils/services/contracts/deployments'
import { hasMultiChainCreationFeatures } from '@/features/multichain/utils/utils'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const NetworkMultiSelector = ({
  name,
  isAdvancedFlow = false,
}: {
  name: string
  isAdvancedFlow?: boolean
}): ReactElement => {
  const { configs } = useChains()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()

  const {
    formState: { errors },
    control,
    getValues,
    setValue,
  } = useFormContext()

  const selectedNetworks: ChainInfo[] = useWatch({ control, name: SetNameStepFields.networks })

  const updateCurrentNetwork = useCallback(
    (chains: ChainInfo[]) => {
      if (chains.length !== 1) return
      const shortName = chains[0].shortName
      const networkLink = getNetworkLink(router, safeAddress, shortName)
      router.replace(networkLink)
    },
    [router, safeAddress],
  )

  const handleDelete = useCallback(
    (deletedChainId: string) => {
      const currentValues: ChainInfo[] = getValues(name) || []
      const updatedValues = currentValues.filter((chain) => chain.chainId !== deletedChainId)
      updateCurrentNetwork(updatedValues)
      setValue(name, updatedValues, { shouldValidate: true })
    },
    [getValues, name, setValue, updateCurrentNetwork],
  )

  const isOptionDisabled = useCallback(
    (optionNetwork: ChainInfo) => {
      // Initially all networks are always available
      if (selectedNetworks.length === 0) {
        return false
      }

      const firstSelectedNetwork = selectedNetworks[0]

      // do not allow multi chain safes for advanced setup flow.
      if (isAdvancedFlow) return optionNetwork.chainId != firstSelectedNetwork.chainId

      // Check required feature toggles
      const optionIsSelectedNetwork = firstSelectedNetwork.chainId === optionNetwork.chainId
      if (!hasMultiChainCreationFeatures(optionNetwork) || !hasMultiChainCreationFeatures(firstSelectedNetwork)) {
        return !optionIsSelectedNetwork
      }

      // Check if required deployments are available
      const optionHasCanonicalSingletonDeployment =
        hasCanonicalDeployment(
          getSafeSingletonDeployments({
            network: optionNetwork.chainId,
            version: getLatestSafeVersion(firstSelectedNetwork),
          }),
          optionNetwork.chainId,
        ) &&
        hasCanonicalDeployment(
          getSafeToL2SetupDeployments({ network: optionNetwork.chainId, version: '1.4.1' }),
          optionNetwork.chainId,
        )

      const selectedHasCanonicalSingletonDeployment =
        hasCanonicalDeployment(
          getSafeSingletonDeployments({
            network: firstSelectedNetwork.chainId,
            version: getLatestSafeVersion(firstSelectedNetwork),
          }),
          firstSelectedNetwork.chainId,
        ) &&
        hasCanonicalDeployment(
          getSafeToL2SetupDeployments({ network: firstSelectedNetwork.chainId, version: '1.4.1' }),
          firstSelectedNetwork.chainId,
        )

      // Only 1.4.1 safes with canonical deployment addresses and SafeToL2Setup can be deployed as part of a multichain group
      if (!selectedHasCanonicalSingletonDeployment) return !optionIsSelectedNetwork
      return !optionHasCanonicalSingletonDeployment
    },
    [isAdvancedFlow, selectedNetworks],
  )

  useEffect(() => {
    if (selectedNetworks.length === 1 && selectedNetworks[0].chainId !== currentChain?.chainId) {
      updateCurrentNetwork([selectedNetworks[0]])
    }
  }, [selectedNetworks, currentChain, updateCurrentNetwork])

  return (
    <>
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            {...field}
            multiple
            value={field.value || []}
            disableCloseOnSelect
            options={configs}
            renderTags={(selectedOptions) =>
              selectedOptions.map((chain) => (
                <Chip
                  variant="outlined"
                  key={chain.chainId}
                  avatar={<ChainIndicator chainId={chain.chainId} onlyLogo inline />}
                  label={chain.chainName}
                  onDelete={() => handleDelete(chain.chainId)}
                  className={css.multiChainChip}
                ></Chip>
              ))
            }
            renderOption={(props, chain, { selected }) => {
              const { key, ...rest } = props

              return (
                <Box component="li" key={key} {...rest}>
                  <Checkbox data-testid="network-checkbox" size="small" checked={selected} />
                  <ChainIndicator chainId={chain.chainId} inline />
                </Box>
              )
            }}
            getOptionLabel={(option) => option.chainName}
            getOptionDisabled={isOptionDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!errors.networks}
                helperText={errors.networks ? 'Select at least one network' : ''}
              />
            )}
            filterOptions={(options, { inputValue }) =>
              options.filter((option) => option.chainName.toLowerCase().includes(inputValue.toLowerCase()))
            }
            isOptionEqualToValue={(option, value) => option.chainId === value.chainId}
            onChange={(_, data) => {
              updateCurrentNetwork(data)
              return field.onChange(data)
            }}
          />
        )}
        rules={{ required: true }}
      />
    </>
  )
}

export default NetworkMultiSelector
