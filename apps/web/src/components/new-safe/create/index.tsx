import ExternalLink from '@/components/common/ExternalLink'
import { CardStepper } from '@/components/new-safe/CardStepper'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import CreateSafeInfos from '@/components/new-safe/create/CreateSafeInfos'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import OwnerPolicyStep from '@/components/new-safe/create/steps/OwnerPolicyStep'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import SetNameStep from '@/components/new-safe/create/steps/SetNameStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { HelpCenterArticle } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import DiscoverSafenetStep from '@/features/safenet/components/new-safe/DiscoverSafenetStep'
import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { CREATE_SAFE_CATEGORY } from '@/services/analytics'
import { getLatestSafeVersion } from '@/utils/chains'
import type { AlertColor } from '@mui/material'
import { Box, Container, Grid, Typography } from '@mui/material'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, type ReactElement } from 'react'
import css from './styles.module.css'

export type NewSafeFormData = {
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

const staticHints: Record<
  number,
  { title: string; variant: AlertColor; steps: { title: string; text: string | ReactElement }[] }
> = {
  1: {
    title: 'Safe Account creation',
    variant: 'info',
    steps: [
      {
        title: 'Network fee',
        text: 'Deploying your Safe Account requires the payment of the associated network fee with your connected wallet. An estimation will be provided in the last step.',
      },
      {
        title: 'Address book privacy',
        text: 'The name of your Safe Account will be stored in a local address book on your device and can be changed at a later stage. It will not be shared with us or any third party.',
      },
    ],
  },
  2: {
    title: 'Safe Account creation',
    variant: 'info',
    steps: [
      {
        title: 'Flat hierarchy',
        text: 'Every signer has the same rights within the Safe Account and can propose, sign and execute transactions that have the required confirmations.',
      },
      {
        title: 'Managing Signers',
        text: 'You can always change the number of signers and required confirmations in your Safe Account after creation.',
      },
      {
        title: 'Safe Account setup',
        text: (
          <>
            Not sure how many signers and confirmations you need for your Safe Account?
            <br />
            <ExternalLink href={HelpCenterArticle.SAFE_SETUP} fontWeight="bold">
              Learn more about setting up your Safe Account.
            </ExternalLink>
          </>
        ),
      },
    ],
  },
  3: {
    title: 'Safe Account creation',
    variant: 'info',
    steps: [
      {
        title: 'Wait for the creation',
        text: 'Depending on network usage, it can take some time until the transaction is successfully added to the blockchain and picked up by our services.',
      },
    ],
  },
  4: {
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

const CreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const isFlowWithDiscoverSafenet = !!router.query.safenet
  const [isSafenetFlow, setIsSafenetFlow] = useState<boolean>(isFlowWithDiscoverSafenet)

  const [safeName, setSafeName] = useState('')
  const [overviewNetworks, setOverviewNetworks] = useState<ChainInfo[]>()

  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState<number>(0)

  useEffect(() => {
    setIsSafenetFlow(!!router.query.safenet)
  }, [router.query.safenet])

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Set up the basics',
      subtitle: 'Give a name to your account and select which networks to deploy it on.',
      render: ({ data, onSubmit, onBack, setStep }) => (
        <SetNameStep
          setOverviewNetworks={setOverviewNetworks}
          setDynamicHint={setDynamicHint}
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          isSafenetFlow={isSafenetFlow}
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
        <ReviewStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} isSafenetFlow={isSafenetFlow} />
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

  if ((isFlowWithDiscoverSafenet && activeStep === 0) || isSafenetFlow) {
    CreateSafeSteps.unshift({
      title: 'Safenet benefits',
      subtitle:
        'Safenet unlocks a unified and secure experience across networks, so you no longer need to worry about bridging.',
      render: ({ data, onSubmit, onBack, setStep }) => (
        <DiscoverSafenetStep
          data={data}
          onSetFlow={setIsSafenetFlow}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    })
  }

  const staticHint = useMemo(() => staticHints[activeStep], [activeStep])
  const safenetStaticHint = useMemo(() => safenetStaticHints[activeStep], [activeStep])

  const initialStep = 0
  const initialData: NewSafeFormData = {
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
          {isFlowWithDiscoverSafenet && activeStep === 0 ? (
            <Box className={css.title}>
              <Typography
                variant="h2"
                sx={{
                  pb: 2,
                }}
              >
                Discover
              </Typography>
              <SafenetLogo height="24" />
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
            discoverSafenet={isFlowWithDiscoverSafenet}
            isSafenetFlow={isSafenetFlow}
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
            {((!isFlowWithDiscoverSafenet && activeStep < 2) ||
              (isFlowWithDiscoverSafenet && activeStep > 0 && activeStep < 3)) && (
              <OverviewWidget
                safeName={safeName}
                networks={overviewNetworks || []}
                isSafenet={isFlowWithDiscoverSafenet}
              />
            )}
            {wallet?.address && (
              <CreateSafeInfos
                staticHint={
                  (isFlowWithDiscoverSafenet && activeStep === 0) || isSafenetFlow ? safenetStaticHint : staticHint
                }
                dynamicHint={dynamicHint}
              />
            )}
            {isSafenetFlow && activeStep < 3 && (
              <Box padding={3}>
                <ExternalLink href="https://docs.safe.global/safenet/overview">Read more about Safenet</ExternalLink>
              </Box>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CreateSafe
