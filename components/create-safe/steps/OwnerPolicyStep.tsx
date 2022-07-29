import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import { ReactElement, useCallback, useEffect } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import ChainIndicator from '@/components/common/ChainIndicator'
import NameInput from '@/components/common/NameInput'
import { CreateSafeFormData, Owner } from '@/components/create-safe'
import useResetSafeCreation from '@/components/create-safe/useResetSafeCreation'
import { StepRenderProps } from '@/components/tx/TxStepper/useTxStepper'
import useAddressBook from '@/hooks/useAddressBook'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/domains'
import { parsePrefixedAddress } from '@/utils/addresses'

type Props = {
  params: CreateSafeFormData
  onSubmit: StepRenderProps['onSubmit']
  onBack: StepRenderProps['onBack']
  setStep: StepRenderProps['setStep']
}

const OwnerPolicyStep = ({ params, onSubmit, setStep, onBack }: Props): ReactElement => {
  useResetSafeCreation(setStep)
  const ethersProvider = useWeb3ReadOnly()
  const wallet = useWallet()

  const addressBook = useAddressBook()

  const defaultOwnerAddressBookName = wallet?.address ? addressBook[wallet.address] : undefined

  const defaultOwner: Owner = {
    name: defaultOwnerAddressBookName || wallet?.ens || '',
    address: wallet?.address || '',
    resolving: false,
  }

  const defaultThreshold = params.threshold || 1

  const formMethods = useForm<CreateSafeFormData>({
    mode: 'all',
    defaultValues: { name: params.name, owners: params.owners ?? [defaultOwner], threshold: defaultThreshold },
  })
  const { register, handleSubmit, control, watch, setValue } = formMethods

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'owners',
  })

  const owners = watch('owners')
  // the owners array does not trigger useEffect when internal values change, therefore we use a signature containing all owner values
  const ownersSignature = owners.map((owner) => owner.address + owner.name).join('')

  const onFormSubmit = (data: CreateSafeFormData) => {
    onSubmit({
      ...data,
      owners: data.owners.map((owner) => ({
        ...owner,
        address: parsePrefixedAddress(owner.address).address,
      })),
    })
  }

  const addOwner = () => {
    append({ name: '', address: '', resolving: false })
  }

  const addAddressBookOrENSName = useCallback(
    async (owner: Owner, index: number) => {
      if (owner.name || owner.resolving || !owner.address || !ethersProvider) return
      setValue(`owners.${index}.resolving`, true)
      const { address } = parsePrefixedAddress(owner.address)
      // Lookup Addressbook
      const nameFromAddressbook = addressBook[address]
      if (nameFromAddressbook) {
        update(index, { ...owner, name: nameFromAddressbook, resolving: false })
        return
      }

      // Lookup ENS
      const ensName = await lookupAddress(ethersProvider, address)
      if (ensName) {
        update(index, { ...owner, name: ensName, resolving: false })
      } else {
        setValue(`owners.${index}.resolving`, false)
      }
    },
    [update, setValue, ethersProvider, addressBook],
  )

  useEffect(() => {
    owners.forEach(addAddressBookOrENSName)
  }, [owners, ownersSignature, addAddressBookOrENSName])

  return (
    <Paper>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Box padding={3}>
            <Typography mb={2}>
              Your Safe will have one or more owners. We have prefilled the first owner with your connected wallet
              details, but you are free to change this to a different owner.
            </Typography>
            <Typography>
              Add additional owners (e.g. wallets of your teammates) and specify how many of them have to confirm a
              transaction before it gets executed. In general, the more confirmations required, the more secure your
              Safe is. Learn about which Safe setup to use. The new Safe will ONLY be available on{' '}
              <ChainIndicator inline />
            </Typography>
          </Box>
          <Divider />
          <Grid container gap={3} flexWrap="nowrap" paddingX={3} paddingY={1}>
            <Grid item xs={12} md={4}>
              Name
            </Grid>
            <Grid item xs={12} md={7}>
              Address
            </Grid>
            <Grid item xs={1} />
          </Grid>
          <Divider />
          <Box padding={3}>
            {fields.map((field, index) => {
              return (
                <Grid container key={field.id} spacing={3} marginBottom={3} flexWrap={['wrap', undefined, 'nowrap']}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <NameInput
                        textFieldProps={{
                          label: 'Owner name',
                          InputLabelProps: { shrink: true },
                          InputProps: {
                            endAdornment: owners[index].resolving ? (
                              <InputAdornment position="end">
                                <CircularProgress size={20} />
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                        name={`owners.${index}.name`}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={10} md={7}>
                    <FormControl fullWidth>
                      <AddressInput label="Owner address" name={`owners.${index}.address`} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={2} md={1} display="flex" alignItems="center" flexShrink={0}>
                    {index > 0 && (
                      <>
                        <IconButton onClick={() => remove(index)}>
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </>
                    )}
                  </Grid>
                </Grid>
              )
            })}
            <Button onClick={addOwner} sx={{ fontWeight: 'normal' }}>
              + Add another owner
            </Button>
            <Typography marginTop={3} marginBottom={1}>
              Any transaction requires the confirmation of:
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl>
                <Select {...register('threshold')} defaultValue={defaultThreshold}>
                  {fields.map((field, index) => {
                    return (
                      <MenuItem key={field.id} value={index + 1}>
                        {index + 1}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
              <Typography>out of {fields.length} owner(s)</Typography>
            </Box>
            <Grid container alignItems="center" justifyContent="center" spacing={3}>
              <Grid item>
                <Button onClick={onBack}>Back</Button>
              </Grid>
              <Grid item>
                <Button variant="contained" type="submit">
                  Continue
                </Button>
              </Grid>
            </Grid>
          </Box>
        </form>
      </FormProvider>
    </Paper>
  )
}

export default OwnerPolicyStep
