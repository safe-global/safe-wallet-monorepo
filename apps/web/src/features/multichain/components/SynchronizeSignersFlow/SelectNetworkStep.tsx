import TxCard from '@/components/tx-flow/common/TxCard'
import { type SynchronizeSetupsData } from '.'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { Box, Button, ButtonBase, CardActions, Divider, Radio, Stack, Typography } from '@mui/material'
import { type SafeSetup } from '../../utils/utils'
import SafeIcon from '@/components/common/SafeIcon'
import useSafeAddress from '@/hooks/useSafeAddress'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import ChainIndicator from '@/components/common/ChainIndicator'
import { shortenAddress } from '@/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'

const SingleSafeSetup = ({
  setup,
  selected,
  onSelect,
}: {
  setup: SafeSetup
  selected: boolean
  onSelect: () => void
}) => {
  const safeAddress = useSafeAddress()
  const addressBooks = useAllAddressBooks()
  const safeName = addressBooks[setup.chainId]?.[safeAddress]
  const chain = useChain(setup.chainId)
  return (
    <ButtonBase
      sx={{
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
        flexDirection: 'row',
        gap: '1',
        border: ({ palette }) => `1px solid ${palette.border.light}`,
      }}
      onClick={onSelect}
    >
      <Radio checked={selected} />

      <Box pr={2.5}>
        <SafeIcon
          address={safeAddress}
          owners={setup.owners.length}
          threshold={setup.threshold}
          chainId={setup.chainId}
          size={32}
        />
      </Box>

      <Typography variant="body2" component="div" mr={2}>
        {safeName && (
          <Typography variant="subtitle2" component="p" fontWeight="bold">
            {safeName}
          </Typography>
        )}
        {chain?.shortName}:
        <Typography color="var(--color-primary-light)" fontSize="inherit" component="span">
          {shortenAddress(safeAddress)}
        </Typography>
      </Typography>

      <ChainIndicator chainId={setup.chainId} />
    </ButtonBase>
  )
}

const SetupSelector = ({ setups, selectedChain }: { setups: SafeSetup[]; selectedChain: string | null }) => {
  const { setValue } = useFormContext<SynchronizeSetupsData>()
  return (
    <Stack spacing={1}>
      {setups.map((setup) => (
        <SingleSafeSetup
          key={setup.chainId}
          setup={setup}
          selected={selectedChain === setup.chainId}
          onSelect={() => setValue('selectedChain', setup.chainId)}
        />
      ))}
    </Stack>
  )
}

export const SelectNetworkStep = ({
  onSubmit,
  data,
  deviatingSetups,
}: {
  onSubmit: (data: SynchronizeSetupsData) => void
  data: SynchronizeSetupsData
  deviatingSetups: SafeSetup[]
}) => {
  const formMethods = useForm<SynchronizeSetupsData>({
    defaultValues: data,
    mode: 'all',
  })

  const { handleSubmit, watch } = formMethods

  const onFormSubmit = handleSubmit((formData: SynchronizeSetupsData) => {
    onSubmit(formData)
  })

  const selectedChain = watch('selectedChain')

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={onFormSubmit}>
          <Stack spacing={1} mb={2}>
            <Typography variant="body2">
              This action copies the setup from another Safe account with the same address.
            </Typography>
            <Typography variant="h5">Select Setup to copy</Typography>
            <SetupSelector setups={deviatingSetups} selectedChain={selectedChain} />
          </Stack>
          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button variant="contained" type="submit" disabled={selectedChain === null}>
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}
