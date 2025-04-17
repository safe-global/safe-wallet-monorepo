import { useVisibleTokens } from '@/components/tx-flow/flows/TokenTransfer/utils'
import { type ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CardActions,
  Divider,
  Grid,
  Link,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import AddIcon from '@/public/images/common/add.svg'
import {
  type MultiTokenTransferParams,
  TokenTransferFields,
  MultiTokenTransferFields,
  TokenTransferType,
  MultiTransfersFields,
} from '.'
import TxCard from '../../common/TxCard'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import RecipientRow from './RecipientRow'
import { SafeAppsName } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import CSVAirdropAppModal from './CSVAirdropAppModal'
import { InsufficientFundsValidationError } from '@/components/common/TokenAmountInput'
import { useHasFeature } from '@/hooks/useChains'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

export const AutocompleteItem = (item: { tokenInfo: TokenInfo; balance: string }): ReactElement => (
  <Grid
    container
    sx={{
      alignItems: 'center',
      gap: 1,
    }}
  >
    <TokenIcon logoUri={item.tokenInfo.logoUri} key={item.tokenInfo.address} tokenSymbol={item.tokenInfo.symbol} />

    <Grid item xs data-testid="token-item">
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

const MAX_RECIPIENTS = 5

export type CreateTokenTransferProps = {
  txNonce?: number
}

export const CreateTokenTransfer = ({ txNonce }: CreateTokenTransferProps): ReactElement => {
  const disableSpendingLimit = txNonce !== undefined
  const [csvAirdropModalOpen, setCsvAirdropModalOpen] = useState<boolean>(false)
  const [maxRecipientsInfo, setMaxRecipientsInfo] = useState<boolean>(false)
  const canCreateStandardTx = useHasPermission(Permission.CreateTransaction)
  const canCreateSpendingLimitTx = useHasPermission(Permission.CreateSpendingLimitTransaction)
  const balancesItems = useVisibleTokens()
  const { setNonce } = useContext(SafeTxContext)
  const [safeApps] = useRemoteSafeApps({ name: SafeAppsName.CSV })
  const isMassPayoutsEnabled = useHasFeature(FEATURES.MASS_PAYOUTS)
  const { onNext, data } = useContext(TxFlowContext) as TxFlowContextType<MultiTokenTransferParams>

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  const formMethods = useForm<MultiTokenTransferParams>({
    defaultValues: {
      ...data,
      [MultiTransfersFields.type]: disableSpendingLimit
        ? TokenTransferType.multiSig
        : canCreateSpendingLimitTx && !canCreateStandardTx
          ? TokenTransferType.spendingLimit
          : data?.type,
      recipients:
        data?.recipients.map(({ tokenAddress, ...rest }) => ({
          ...rest,
          [TokenTransferFields.tokenAddress]:
            canCreateSpendingLimitTx && !canCreateStandardTx ? balancesItems[0]?.tokenInfo.address : tokenAddress,
        })) || [],
    },
    mode: 'onChange',
    delayError: 500,
  })

  const { handleSubmit, control, watch, formState } = formMethods

  const hasInsufficientFunds = useMemo(
    () =>
      !!formState.errors.recipients &&
      formState.errors.recipients.some?.((item) => item?.amount?.message === InsufficientFundsValidationError),
    [formState],
  )

  const type = watch(MultiTransfersFields.type)

  const {
    fields: recipientFields,
    append,
    remove,
  } = useFieldArray({ control, name: MultiTokenTransferFields.recipients })

  const canAddMoreRecipients = useMemo(() => recipientFields.length < MAX_RECIPIENTS, [recipientFields])

  const addRecipient = (): void => {
    if (!canAddMoreRecipients) {
      setCsvAirdropModalOpen(true)
      return
    }

    if (recipientFields.length === 1) {
      setMaxRecipientsInfo(true)
    }

    append({
      recipient: '',
      tokenAddress: ZERO_ADDRESS,
      amount: '',
    })
  }

  const removeRecipient = (index: number): void => {
    if (recipientFields.length > 1) {
      remove(index)
    }
  }

  const csvAirdropAppUrl = safeApps?.[0]?.url

  const CsvAirdropLink = () => (
    <Link sx={{ cursor: 'pointer' }} onClick={() => setCsvAirdropModalOpen(true)}>
      CSV Airdrop
    </Link>
  )

  const canBatch = isMassPayoutsEnabled && type === TokenTransferType.multiSig

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onNext)} className={commonCss.form}>
          <Stack spacing={3}>
            <Stack spacing={8}>
              {recipientFields.map((field, index) => (
                <RecipientRow
                  key={field.id}
                  removable={recipientFields.length > 1}
                  fieldArray={{ name: MultiTokenTransferFields.recipients, index }}
                  remove={removeRecipient}
                  disableSpendingLimit={disableSpendingLimit || recipientFields.length > 1}
                />
              ))}
            </Stack>

            {canBatch && (
              <>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
                  <Track {...MODALS_EVENTS.ADD_RECIPIENT}>
                    <Button
                      data-testid="add-recipient-btn"
                      variant="text"
                      onClick={addRecipient}
                      disabled={!canAddMoreRecipients}
                      startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                      size="large"
                    >
                      Add recipient
                    </Button>
                  </Track>
                  <Typography
                    data-testid="recipients-count"
                    variant="body2"
                    color={canAddMoreRecipients ? 'primary' : 'error.main'}
                  >{`${recipientFields.length}/${MAX_RECIPIENTS}`}</Typography>
                </Stack>

                {hasInsufficientFunds && (
                  <Alert data-testid="insufficient-balance-error" severity="error">
                    <AlertTitle>Insufficient balance</AlertTitle>
                    <Typography variant="body2">
                      The total amount assigned to all recipients exceeds your available balance. Please adjust the
                      amounts you want to send.
                    </Typography>
                  </Alert>
                )}

                {canAddMoreRecipients && maxRecipientsInfo && !!csvAirdropAppUrl && (
                  <Alert severity="info" onClose={() => setMaxRecipientsInfo(false)}>
                    <Typography variant="body2">
                      If you want to add more than {MAX_RECIPIENTS} recipients, use <CsvAirdropLink />
                    </Typography>
                  </Alert>
                )}

                {!canAddMoreRecipients && (
                  <Alert data-testid="max-recipients-reached" severity="warning">
                    <Typography variant="body2">
                      No more recipients can be added.
                      {!!csvAirdropAppUrl && (
                        <>
                          <br />
                          Please use <CsvAirdropLink />
                        </>
                      )}
                    </Typography>
                  </Alert>
                )}

                {csvAirdropModalOpen && (
                  <CSVAirdropAppModal onClose={() => setCsvAirdropModalOpen(false)} appUrl={csvAirdropAppUrl} />
                )}
              </>
            )}

            <Box>
              <Divider className={commonCss.nestedDivider} />

              <CardActions>
                <Button variant="contained" type="submit">
                  Next
                </Button>
              </CardActions>
            </Box>
          </Stack>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateTokenTransfer
