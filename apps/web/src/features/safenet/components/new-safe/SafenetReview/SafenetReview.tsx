import type { NewSafeFormData } from '@/components/new-safe/create'
import { updateAddressBook } from '@/components/new-safe/create/logic/address-book'
import { AppRoutes } from '@/config/routes'
import { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { SafeCreationEvent, safeCreationDispatch } from '@/features/counterfactual/services/safeCreationEvents'
import { CF_TX_GROUP_KEY, replayCounterfactualSafeDeployment } from '@/features/counterfactual/utils'
import { gtmSetChainId } from '@/services/analytics/gtm'
import { useAppDispatch } from '@/store'
import { useLazyDeploySafenetAccountQuery } from '@/store/safenet'
import type { ReplayedSafeProps } from '@/store/slices'
import CheckIcon from '@mui/icons-material/Check'
import { Box, Typography } from '@mui/material'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { useRouter } from 'next/router'
import type { Dispatch, SetStateAction } from 'react'
import SafenetTag from '../../SafenetTag'
import css from './styles.module.css'

export type UseSubmitSafenetReviewHandlerProps = {
  data: NewSafeFormData
  onSubmit: (data: Partial<NewSafeFormData>) => void
  setSubmitError: Dispatch<SetStateAction<string | undefined>>
  setIsCreating: Dispatch<SetStateAction<boolean>>
}

export type SafenetReviewType = {
  handleCreateSafeClick: () => void
}

export const useSubmitSafenetReviewHandler = ({
  data,
  onSubmit,
  setSubmitError,
  setIsCreating,
}: UseSubmitSafenetReviewHandlerProps): SafenetReviewType => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [deploy] = useLazyDeploySafenetAccountQuery()

  const onDeployment = (
    deploymentResult: Awaited<ReturnType<ReturnType<typeof useLazyDeploySafenetAccountQuery>[0]>>,
  ) => {
    const { data: deploymentData, error } = deploymentResult
    if (error) {
      console.error(error)
      setSubmitError('Error creating the Safe Account. Please try again later.')
      setIsCreating(false)
      return
    }
    if (!deploymentData || !data) return

    const replayedSafeWithNonce: ReplayedSafeProps = {
      factoryAddress: deploymentData.factoryAddress,
      masterCopy: deploymentData.masterCopy,
      safeAccountConfig: {
        threshold: deploymentData.safeAccountConfig.threshold,
        owners: data.owners.map((owner) => owner.address),
        to: deploymentData.safeAccountConfig.to || ZERO_ADDRESS,
        data: deploymentData.safeAccountConfig.data || EMPTY_DATA,
        fallbackHandler: deploymentData.safeAccountConfig.fallbackHandler || ZERO_ADDRESS,
        paymentReceiver: ZERO_ADDRESS, // data.paymentReceiver ?? ECOSYSTEM_ID_ADDRESS,
      },
      saltNonce: deploymentData.saltNonce,
      safeVersion: deploymentData.safeVersion,
    }

    data.networks.map((chain) => {
      gtmSetChainId(chain.chainId)

      replayCounterfactualSafeDeployment(
        chain.chainId,
        deploymentData.safeAddress,
        replayedSafeWithNonce,
        data.name,
        dispatch,
        PayMethod.PayNow,
      )

      safeCreationDispatch(SafeCreationEvent.SAFENET_RELAYING, {
        groupKey: CF_TX_GROUP_KEY,
        safeAddress: deploymentData.safeAddress,
        chainId: chain.chainId,
      })

      //trackEvent({ ...OVERVIEW_EVENTS.PROCEED_WITH_TX, label: 'deployment', category: CREATE_SAFE_CATEGORY })
      //trackEvent(CREATE_SAFE_EVENTS.SUBMIT_CREATE_SAFE)
    })

    onSubmit(data)

    // Update addressbook with owners and Safe on all chosen networks
    dispatch(
      updateAddressBook(
        data.networks.map((network) => network.chainId),
        deploymentData.safeAddress,
        data.name,
        data.owners,
        data.threshold,
      ),
    )

    router?.push({
      pathname: AppRoutes.home,
      query: { safe: `${data.networks[0].shortName}:${deploymentData.safeAddress}` },
    })
  }

  const handleCreateSafeClick = async () => {
    setIsCreating(true)

    const deploymentResult = await deploy({
      account: {
        owners: data.owners.map((owner) => owner.address),
        threshold: data.threshold,
      },
      saltNonce: Date.now().toString(),
    })

    onDeployment(deploymentResult)
  }

  return {
    handleCreateSafeClick,
  }
}

function SafenetReview() {
  return (
    <Box
      className={css.row}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Typography variant="body2">This transaction is sponsored, so you don&apos;t need to pay any fees.</Typography>
      <Box className={css.box}>
        <Box className={css.message}>
          <Typography variant="body2" fontWeight="bold">
            Gas free transaction
          </Typography>
          <CheckIcon color="success" fontSize="small" />
        </Box>
        <SafenetTag sponsored />
      </Box>
    </Box>
  )
}

export default SafenetReview
