import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import ReviewRow from '@/components/new-safe/ReviewRow'
import type { NewSafeFormData } from '@/components/new-safe/create'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import type { NamedAddress } from '@/components/new-safe/create/types'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import ErrorMessage from '@/components/tx/ErrorMessage'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import SafenetNetworkSelector from '@/features/safenet/components/SafenetNetworkSelector'
import SafenetReview from '@/features/safenet/components/new-safe/SafenetReview'
import type { SafenetReviewType } from '@/features/safenet/components/new-safe/SafenetReview/SafenetReview'
import { useSubmitSafenetReviewHandler } from '@/features/safenet/components/new-safe/SafenetReview/SafenetReview'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, CircularProgress, Divider, Grid, Tooltip, Typography } from '@mui/material'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import type { ReviewType } from './Review'
import { Review, useSubmitReviewHandler } from './Review'

export const NetworkFee = ({
  totalFee,
  chain,
  isWaived,
  inline = false,
}: {
  totalFee: string
  chain: ChainInfo | undefined
  isWaived: boolean
  inline?: boolean
}) => {
  return (
    <Box className={classnames(css.networkFee, { [css.networkFeeInline]: inline })}>
      <Typography className={classnames({ [css.strikethrough]: isWaived })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </Box>
  )
}

export const SafeSetupOverview = ({
  name,
  owners,
  threshold,
  networks,
  isSafenetFlow = false,
}: {
  name?: string
  owners: NamedAddress[]
  threshold: number
  networks: ChainInfo[]
  isSafenetFlow?: boolean
}) => {
  return (
    <Grid container spacing={3}>
      {!isSafenetFlow ? (
        <ReviewRow
          name={networks.length > 1 ? 'Networks' : 'Network'}
          value={
            <Tooltip
              title={
                <Box>
                  {networks.map((safeItem) => (
                    <Box
                      key={safeItem.chainId}
                      sx={{
                        p: '4px 0px',
                      }}
                    >
                      <ChainIndicator chainId={safeItem.chainId} />
                    </Box>
                  ))}
                </Box>
              }
              arrow
            >
              <Box
                data-testid="network-list"
                sx={{
                  display: 'inline-block',
                }}
              >
                <NetworkLogosList networks={networks} />
              </Box>
            </Tooltip>
          }
        />
      ) : (
        <ReviewRow name={networks.length > 1 ? 'Networks' : 'Network'} value={<SafenetNetworkSelector expandable />} />
      )}
      {name && <ReviewRow name="Name" value={<Typography data-testid="review-step-safe-name">{name}</Typography>} />}
      <ReviewRow
        name="Signers"
        value={
          <Box data-testid="review-step-owner-info" className={css.ownersArray}>
            {owners.map((owner, index) => (
              <EthHashInfo
                address={owner.address}
                name={owner.name || owner.ens}
                shortAddress={false}
                showPrefix={false}
                showName
                hasExplorer
                showCopyButton
                key={index}
              />
            ))}
          </Box>
        }
      />
      <ReviewRow
        name="Threshold"
        value={
          <Typography data-testid="review-step-threshold">
            {threshold} out of {owners.length} {owners.length > 1 ? 'signers' : 'signer'}
          </Typography>
        }
      />
    </Grid>
  )
}

type UseSubmitHandlerProps = {
  isSafenetFlow: boolean
  data: NewSafeFormData
  onSubmit: (data: Partial<NewSafeFormData>) => void
  setSubmitError: Dispatch<SetStateAction<string | undefined>>
  setIsCreating: Dispatch<SetStateAction<boolean>>
}

const useSubmitHandler = (props: UseSubmitHandlerProps): ReviewType | SafenetReviewType => {
  const safeProps = useSubmitReviewHandler(props)
  const safenetProps = useSubmitSafenetReviewHandler(props)
  return props.isSafenetFlow ? safenetProps : safeProps
}

const ReviewStep = ({
  data,
  onSubmit,
  onBack,
  setStep,
  isSafenetFlow = false,
}: StepRenderProps<NewSafeFormData> & { isSafenetFlow?: boolean }) => {
  useSyncSafeCreationStep(setStep, data.networks)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>()

  const props = useSubmitHandler({ isSafenetFlow, data, onSubmit, setSubmitError, setIsCreating })
  const { handleCreateSafeClick } = props

  const handleBack = () => {
    onBack(data)
  }

  const isDisabled = isCreating || (props as ReviewType).showNetworkWarning

  return (
    <>
      <Box data-testid="safe-setup-overview" className={layoutCss.row}>
        <SafeSetupOverview
          name={data.name}
          owners={data.owners}
          threshold={data.threshold}
          networks={data.networks}
          isSafenetFlow={isSafenetFlow}
        />
      </Box>
      <Divider />
      {isSafenetFlow ? <SafenetReview /> : <Review {...(props as ReviewType)} />}
      <Divider />
      <Box className={layoutCss.row}>
        {submitError && <ErrorMessage className={css.errorMessage}>{submitError}</ErrorMessage>}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Button
            data-testid="back-btn"
            variant="outlined"
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBackIcon fontSize="small" />}
          >
            Back
          </Button>
          <Button
            data-testid="review-step-next-btn"
            onClick={handleCreateSafeClick}
            variant="contained"
            size="stretched"
            disabled={isDisabled}
          >
            {isCreating ? <CircularProgress size={18} /> : 'Create account'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default ReviewStep
