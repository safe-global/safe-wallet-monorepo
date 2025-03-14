import TokenIcon from '@/components/common/TokenIcon'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import TxCard from '@/components/tx-flow/common/TxCard'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { SafeAppsName } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import AddIcon from '@/public/images/common/add.svg'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import { formatVisualAmount } from '@/utils/formatters'
import { Alert, AlertTitle, Button, CardActions, Divider, Grid, Link, Stack, SvgIcon, Typography } from '@mui/material'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useContext, useEffect, useState, type ReactElement } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import CSVAirdropAppModal from './CSVAirdropAppModal'
import RecipientRow from './RecipientRow'
import { TokenTransfersFields, type TokenTransfersParams } from './SafenetTokenTransfers'

export const AutocompleteItem = (item: { tokenInfo: TokenInfo; balance: string }): ReactElement => (
  <Grid
    container
    sx={{
      alignItems: 'center',
      gap: 1,
    }}
  >
    <TokenIcon logoUri={item.tokenInfo.logoUri} key={item.tokenInfo.address} tokenSymbol={item.tokenInfo.symbol} />

    <Grid item xs>
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'normal',
        }}
      >
        {item.tokenInfo.name}
      </Typography>

      <Typography variant="caption" component="p">
        {formatVisualAmount(item.balance, item.tokenInfo.decimals)} {item.tokenInfo.symbol}
      </Typography>
    </Grid>
  </Grid>
)

export const CreateTokenTransfers = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: TokenTransfersParams
  onSubmit: (data: TokenTransfersParams) => void
  txNonce?: number
}): ReactElement => {
  const [csvAirdropModalOpen, setCsvAirdropModalOpen] = useState<boolean>(false)
  const [maxRecipientsAlert, setMaxRecipientsAlert] = useState<boolean>(false)
  // TODO: Calculate maxAmount and set maxAmountAlert
  const [maxAmountAlert] = useState<boolean>(false)
  const { setNonce } = useContext(SafeTxContext)
  const [safeApps] = useRemoteSafeApps({ name: SafeAppsName.CSV })

  const maxRecipients = 5

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  const formMethods = useForm<TokenTransfersParams>({
    defaultValues: {
      ...params,
    },
    mode: 'onChange',
    delayError: 500,
  })

  const { handleSubmit, control } = formMethods

  const {
    fields: recipientFields,
    append,
    remove: removeRecipient,
  } = useFieldArray({ control, name: TokenTransfersFields.recipients })

  const addRecipient = (): void => {
    if (recipientFields.length === maxRecipients) {
      setCsvAirdropModalOpen(true)
      return
    }

    if (recipientFields.length === 1) {
      setMaxRecipientsAlert(true)
    }
    append({
      recipient: '',
      tokenAddress: ZERO_ADDRESS,
      amount: '',
    })
  }

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className={commonCss.form}>
          {recipientFields.map((field, i) => (
            <>
              <RecipientRow
                key={field.id}
                index={i}
                removable={i > 0}
                groupName={TokenTransfersFields.recipients}
                remove={removeRecipient}
              />
              {(i < recipientFields.length - 1 || (maxRecipientsAlert && i === 0)) && <Divider sx={{ mb: 3 }} />}
              {maxRecipientsAlert && i === 0 && (
                <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMaxRecipientsAlert(false)}>
                  <Typography variant="body2">
                    If you want to add more than {maxRecipients} recipients, use{' '}
                    <Link sx={{ cursor: 'pointer' }} onClick={() => setCsvAirdropModalOpen(true)}>
                      CSV Airdrop
                    </Link>{' '}
                    .
                  </Typography>
                </Alert>
              )}
            </>
          ))}

          {maxAmountAlert && (
            <Alert severity="error" icon={<SvgIcon component={InfoOutlinedIcon} color="error" />} sx={{ mb: 2 }}>
              <AlertTitle>
                <Typography variant="h5" fontWeight={700}>
                  Insufficient balance
                </Typography>
              </AlertTitle>
              <Typography>
                The total amount assigned to all recipients exceeds your available balance. Adjust the amounts you want
                to send.
              </Typography>
            </Alert>
          )}

          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
            <Button
              data-testid="add-recipient-btn"
              variant="text"
              onClick={addRecipient}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
              size="large"
            >
              Add new recipient
            </Button>
            <Typography variant="body2">{`${recipientFields.length}/${maxRecipients}`}</Typography>
          </Stack>

          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button variant="contained" type="submit">
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>

      {csvAirdropModalOpen && (
        <CSVAirdropAppModal onClose={() => setCsvAirdropModalOpen(false)} appUrl={safeApps?.[0]?.url} />
      )}
    </TxCard>
  )
}

export default CreateTokenTransfers
