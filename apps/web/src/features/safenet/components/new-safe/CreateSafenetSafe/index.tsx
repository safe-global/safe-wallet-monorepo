import ExternalLink from '@/components/common/ExternalLink'
import { CardStepper } from '@/components/new-safe/CardStepper'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import CreateSafeInfos from '@/components/new-safe/create/CreateSafeInfos'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import OwnerPolicyStep from '@/components/new-safe/create/steps/OwnerPolicyStep'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { AppRoutes } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { CREATE_SAFE_CATEGORY } from '@/services/analytics'
import { getLatestSafeVersion } from '@/utils/chains'
import type { AlertColor } from '@mui/material'
import { Box, Container, Grid, Typography } from '@mui/material'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useRouter } from 'next/router'
import { useMemo, useState, type ReactElement } from 'react'
import DiscoverSafenetStep from '../DiscoverSafenetStep'
import SafenetNameStep from '../SafenetNameStep'
import css from './styles.module.css'

export type SafenetCreationFormData = {
  name: string
  networks: ChainInfo[]
  threshold: number
  owners: NamedAddress[]
  saltNonce?: number
  safeVersion: SafeVersion
  safeAddress?: string
  willRelay?: boolean
  paymentReceiver?: string
}

const safenetStaticHints: Record<
  number,
  { title: string; variant: AlertColor; steps: { title: string; text: string | ReactElement }[] }
> = {
  0: {
    title: 'More about Safenet',
    variant: 'info',
    steps: [
      {
        title: 'Same address, many networks',
        text: 'Your account will be deployed and activated on all Safenet supported networks, for free. You can add more networks later.',
      },
      {
        title: 'Safenet guard and module',
        text: 'To enjoy a unified and secure Safenet experience, an audited guard and module need to be added to your new Safe account.',
      },
      {
        title: 'Disable anytime',
        text: 'You can disable Safenet at any time and remove the associated guard and module.',
      },
    ],
  },
  2: {
    title: 'Safe Account creation',
    variant: 'info',
    steps: [
      {
        title: 'Address book privacy',
        text: 'The name of your Safe Account will be stored in a local address book on your device and can be changed at a later stage. It will not be shared with us or any third party.',
      },
    ],
  },
  4: {
    title: 'Safe Account creation',
    variant: 'info',
    steps: [
      {
        title: 'Wait for the creation',
        text: 'Depending on network usage, it can take some time until the transaction is successfully added to the blockchain and picked up by our services.',
      },
    ],
  },
  5: {
    title: 'Safe Account usage',
    variant: 'success',
    steps: [
      {
        title: 'Connect your Safe Account',
        text: 'In our Safe Apps section you can connect your Safe Account to over 70 dApps directly or via Wallet Connect to interact with any application.',
      },
    ],
  },
}

const CreateSafenetAccount = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [overviewNetworks, setOverviewNetworks] = useState<ChainInfo[]>()

  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState<number>(0)

  const CreateSafeSteps: TxStepperProps<SafenetCreationFormData>['steps'] = [
    {
      title: 'Safenet benefits',
      subtitle:
        'Safenet unlocks a unified and secure experience across networks, so you no longer need to worry about bridging.',
      render: ({ data, onSubmit, onBack, setStep }) => (
        <DiscoverSafenetStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
      ),
    },
    {
      title: 'Set up the basics',
      subtitle: 'Give a name to your account and select which networks to deploy it on.',
      render: ({ data, onSubmit, onBack, setStep }) => (
        <SafenetNameStep
          setOverviewNetworks={setOverviewNetworks}
          setDynamicHint={setDynamicHint}
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Signers and confirmations',
      subtitle:
        'Set the signer wallets of your Safe Account and how many need to confirm to execute a valid transaction.',
      render: ({ data, onSubmit, onBack, setStep }) => (
        <OwnerPolicyStep
          setDynamicHint={setDynamicHint}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Review',
      subtitle:
        "You're about to create a new Safe and will have to confirm the transaction with your connected wallet.",
      render: ({ data, onSubmit, onBack, setStep }) => (
        <ReviewStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} isSafenetFlow={true} />
      ),
    },
    {
      title: '',
      subtitle: '',
      render: ({ data, onSubmit, onBack, setStep, setProgressColor, setStepData }) => (
        <CreateSafeStatus
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setProgressColor={setProgressColor}
          setStepData={setStepData}
        />
      ),
    },
  ]

  const safenetStaticHint = useMemo(() => safenetStaticHints[activeStep], [activeStep])

  const initialStep = 0
  const initialData: SafenetCreationFormData = {
    name: '',
    networks: [],
    owners: [],
    threshold: 1,
    safeVersion: getLatestSafeVersion(chain) as SafeVersion,
  }

  const onClose = () => {
    router.push(AppRoutes.welcome.index)
  }

  return (
    <Container>
      <Grid
        container
        columnSpacing={3}
        sx={{
          justifyContent: 'center',
          mt: [2, null, 7],
        }}
      >
        <Grid item xs={12}>
          {activeStep === 0 ? (
            <Box className={css.title}>
              <Typography
                variant="h2"
                sx={{
                  pb: 2,
                }}
              >
                Discover
              </Typography>
              <SafenetLogo height="24" className={css.logo} />
            </Box>
          ) : (
            <Typography
              variant="h2"
              sx={{
                pb: 2,
              }}
            >
              Create new Safe Account
            </Typography>
          )}
        </Grid>
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            order: [1, null, 0],
          }}
        >
          <CardStepper
            initialData={initialData}
            initialStep={initialStep}
            onClose={onClose}
            steps={CreateSafeSteps}
            eventCategory={CREATE_SAFE_CATEGORY}
            setWidgetStep={setActiveStep}
            customProgressBar={
              <Box className={css.safenetHeader}>
                <Typography fontSize={14}>Powered by</Typography>
                <SafenetDarkLogo height="14" />
              </Box>
            }
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            mb: [3, null, 0],
            order: [0, null, 1],
          }}
        >
          <Grid container spacing={3}>
            {activeStep > 0 && activeStep < 3 && (
              <OverviewWidget safeName={safeName} networks={overviewNetworks || []} isSafenet={true} />
            )}
            {wallet?.address && <CreateSafeInfos staticHint={safenetStaticHint} dynamicHint={dynamicHint} />}
            {activeStep < 3 && (
              <Box padding={3}>
                <ExternalLink href="https://docs.safe.global/safenet/overview" color="textPrimary">
                  Read more about Safenet
                </ExternalLink>
              </Box>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CreateSafenetAccount
