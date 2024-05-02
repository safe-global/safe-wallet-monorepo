import ChainIndicator from '@/components/common/ChainIndicator'
import type { NamedAddress } from '@/components/new-safe/create/types'
// import EthHashInfo from '@/components/common/EthHashInfo'
import { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
// import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
// import { computeNewSafeAddress } from '@/components/new-safe/create/logic'
// import { getAvailableSaltNonce } from '@/components/new-safe/create/logic/utils'
// import ErrorMessage from '@/components/tx/ErrorMessage';
// import {
//   ExecutionMethod,
//   ExecutionMethodSelector,
// } from '@/components/tx/ExecutionMethodSelector';
// import { RELAY_SPONSORS } from '@/components/tx/SponsoredBy';
import { LATEST_SAFE_VERSION } from '@/config/constants'
// import PayNowPayLater, {
//   PayMethod,
// } from '@/features/counterfactual/PayNowPayLater';
// import { createCounterfactualSafe } from '@/features/counterfactual/utils';
import { useCurrentChain } from '@/hooks/useChains'
import useGasPrice from '@/hooks/useGasPrice'
// import useIsWrongChain from '@/hooks/useIsWrongChain';
// import {
//   MAX_HOUR_RELAYS,
//   useLeastRemainingRelays,
// } from '@/hooks/useRemainingRelays';
// import useWalletCanPay from '@/hooks/useWalletCanPay';
// import useWallet from '@/hooks/wallets/useWallet';
import { useWeb3 } from '@/hooks/wallets/web3'

// import { gtmSetSafeAddress } from '@/services/analytics/gtm';
import { getReadOnlyFallbackHandlerContract } from '@/services/contracts/safeContracts'
// import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule';
// import { useAppDispatch } from '@/store'
// import { FEATURES } from '@/utils/chains'
// import { hasRemainingRelays } from '@/utils/relaying';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, CircularProgress, Divider, Grid, Typography } from '@mui/material'
import { type DeploySafeProps } from '@safe-global/protocol-kit'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
// import Image from 'next/image'
// import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ErrorMessage from '@/components/tx/ErrorMessage'
// import { useWallet } from '@/hooks/useWallet'
import NounsAvatar from '@/components/common/NounsAvatar'
import type { NounProps } from '../AvatarStep'
import Identicon from '@/components/common/Identicon'
// import WalletIcon from '@/components/common/WalletIcon'
// import PayNowPayLater from '@/features/counterfactual/PayNowPayLater'
import { usePendingSafe } from '../StatusStep/usePendingSafe'
import useWallet from '@/hooks/wallets/useWallet'
import PayNowPayLater from '@/features/counterfactual/PayNowPayLater'
import { getAvailableSaltNonce } from '../../logic/utils'
import { computeNewSafeAddress } from '../../logic'
// import { usePendingSafe } from '../StatusStep/usePendingSafe';

export const NetworkFee = ({
  totalFee,
  chain,
  willRelay,
  inline = false,
}: {
  totalFee: string
  chain: ChainInfo | undefined
  willRelay: boolean
  inline?: boolean
}) => {
  // const wallet = useWallet();

  // const isSocialLogin = isSocialLoginWallet(wallet?.label);

  return (
    <Box
      className={classnames(css.networkFee, {
        [css.networkFeeInline]: inline,
      })}
    >
      <Typography className={classnames({ [css.sponsoredFee]: willRelay })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </Box>
  )
}

export const SafeSetupOverview = ({
  wallet,
  id,
  name,
  seed,
}: {
  name?: string
  wallet: NamedAddress
  id: string
  seed: NounProps
}) => {
  const chain = useCurrentChain()

  return (
    <Grid container justifyContent="center" alignItems="center" spacing={3}>
      <ReviewRow name="Network" value={<ChainIndicator chainId={chain?.chainId} inline />} />
      <ReviewRow
        name="Wallet"
        value={
          <Box className={css.container}>
            <Box className={css.imageContainer}>
              <Identicon address={wallet.address} size={24} />
            </Box>
            <Typography>{wallet.address}</Typography>
          </Box>
        }
      />
      <ReviewRow name="Account ID" value={<Typography>{id}</Typography>} />
      {name && <ReviewRow name="Wallet Name" value={<Typography>{name}</Typography>} />}
      <ReviewRow
        name="Avatar"
        value={
          <Box className={css['avatar-container']}>
            <NounsAvatar seed={seed} />
          </Box>
        }
      />
    </Grid>
  )
}

const ReviewStep = ({ data, onBack, setStep, onSubmit }: StepRenderProps<NewSafeFormData>) => {
  const wallet = useWallet()
  useSyncSafeCreationStep(setStep)
  const chain = useCurrentChain()
  const provider = useWeb3()
  const [gasPrice] = useGasPrice()
  const [_, setPendingSafe] = usePendingSafe()
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>()

  const safeParams = useMemo(() => {
    return {
      owners: data.owners.map((owner) => owner.address),
      threshold: data.threshold,
      saltNonce: Date.now(),
      id: data.id,
      seed: data.seed,
    }
  }, [data.owners, data.threshold, data.id, data.seed])

  const { gasLimit } = useEstimateSafeCreationGas(safeParams)

  const maxFeePerGas = gasPrice?.maxFeePerGas

  const totalFee = getTotalFeeFormatted(maxFeePerGas, gasLimit, chain)

  const isCounterfactual = true

  const handleBack = () => {
    onBack(data)
  }

  const createSafe = async () => {
    if (!wallet || !provider || !chain) return

    setIsCreating(true)

    try {
      const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(
        chain.chainId,
        LATEST_SAFE_VERSION,
      )

      const props: DeploySafeProps & {
        superChainProps: {
          id: string
          seed: NounProps
        }
      } = {
        safeAccountConfig: {
          threshold: data.threshold,
          owners: data.owners.map((owner) => owner.address),
          fallbackHandler: await readOnlyFallbackHandlerContract.getAddress(),
        },
        superChainProps: {
          id: data.id,
          seed: data.seed,
        },
      }

      const saltNonce = await getAvailableSaltNonce(provider, {
        ...props,
        saltNonce: '0',
      })
      const safeAddress = await computeNewSafeAddress(provider, {
        ...props,
        saltNonce,
      })

      const pendingSafe = {
        ...data,
        saltNonce: Number(saltNonce),
        safeAddress,
        willRelay: false,
      }

      setPendingSafe(pendingSafe)
      onSubmit(pendingSafe)
    } catch (_err) {
      console.error(_err)
      setSubmitError('Error creating the Safe Account. Please try again later.')
    }

    setIsCreating(false)
  }

  const isDisabled = false

  return (
    <>
      <Box className={layoutCss.row}>
        <SafeSetupOverview name={data.name} seed={data.seed} id={data.id} wallet={data.owners[0]} />
      </Box>

      {isCounterfactual && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <PayNowPayLater />

            <Grid className={css['estimated-fee-warn']} item>
              <Typography component="div">
                You will have to confirm a transaction and pay an estimated fee of{' '}
                <NetworkFee totalFee={totalFee} willRelay={false} chain={chain} inline /> with your connected wallet
              </Typography>
            </Grid>
          </Box>
        </>
      )}

      <Divider />

      <Box className={layoutCss.row}>
        {submitError && <ErrorMessage className={css.errorMessage}>{submitError}</ErrorMessage>}
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
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
            onClick={createSafe}
            variant="contained"
            size="stretched"
            disabled={isDisabled}
          >
            {isCreating ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default ReviewStep
