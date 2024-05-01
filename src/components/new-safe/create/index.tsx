import { Container, Typography, Grid } from '@mui/material'
import { useRouter } from 'next/router'

import useWallet from '@/hooks/wallets/useWallet'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import type { NamedAddress } from '@/components/new-safe/create/types'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import useAddressBook from '@/hooks/useAddressBook'
import { CardStepper } from '@/components/new-safe/CardStepper'
import { AppRoutes } from '@/config/routes'
import type { AlertColor } from '@mui/material'
import { type ReactElement, useState } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@/config/constants'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import SuperChainID from './steps/SuperChainIdStep'
import Avatar from './steps/AvatarStep'
import type { NounProps } from './steps/AvatarStep'

export type NewSafeFormData = {
  name: string
  threshold: number
  seed: NounProps
  owners: NamedAddress[]
  saltNonce: number
  safeAddress?: string
  willRelay?: boolean
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

const CreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const addressBook = useAddressBook()
  const defaultOwnerAddressBookName = wallet?.address ? addressBook[wallet.address] : undefined
  const defaultOwner: NamedAddress = {
    name: defaultOwnerAddressBookName || wallet?.ens || '',
    address: wallet?.address || '',
  }

  const [walletName, setWalletName] = useState('')

  const [superChainId, setSuperChainId] = useState('')
  const [seed, setSeed] = useState<NounProps>({
    background: 0,
    body: 0,
    head: 0,
    accessory: 0,
    glasses: 0,
  })
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Select a name and ID for your Superchain Account',
      subtitle: '',
      render: (data, onSubmit, onBack, setStep) => (
        <SuperChainID
          onBack={onBack}
          data={data}
          onSubmit={onSubmit}
          setSuperChainId={setSuperChainId}
          setWalletName={setWalletName}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Customize your Superchain Account Avatar',
      subtitle: 'This avatar will be the face of your Superchain Account',
      render: (data, onSubmit, onBack, setStep) => (
        <Avatar setStep={setStep} onBack={onBack} seed={seed} setSeed={setSeed} onSubmit={onSubmit} data={data} />
      ),
    },
    {
      title: 'Review',
      subtitle:
        "You're about to create a new Superchain Account and will have to confirm the transaction with your connected wallet.",
      render: (data, onSubmit, onBack, setStep) => (
        <ReviewStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
      ),
    },
    {
      title: '',
      subtitle: '',
      render: (data, onSubmit, onBack, setStep, setProgressColor) => (
        <CreateSafeStatus
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setProgressColor={setProgressColor}
        />
      ),
    },
  ]

  const mnemonicSafeName = useMnemonicSafeName()

  // Jump to review screen when using social login
  const isSocialLogin = isSocialLoginWallet(wallet?.label)
  const initialStep = isSocialLogin ? 2 : 0

  const initialData: NewSafeFormData = {
    name: isSocialLogin ? mnemonicSafeName : '',
    owners: [defaultOwner],
    threshold: 1,
    seed,
    saltNonce: Date.now(),
  }

  const onClose = () => {
    router.push(AppRoutes.welcome.index)
  }

  return (
    <Container>
      <Grid container columnSpacing={3} justifyContent="center" mt={[2, null, 7]}>
        <Grid item xs={activeStep < 2 ? 12 : 8}>
          <Typography variant="h2" pb={2}>
            Create new Safe Account
          </Typography>
        </Grid>
        <Grid item xs={12} md={8} order={[1, null, 0]}>
          <CardStepper
            initialData={initialData}
            initialStep={initialStep}
            onClose={onClose}
            steps={CreateSafeSteps}
            setWidgetStep={setActiveStep}
          />
        </Grid>
        {activeStep < 2 && (
          <Grid item xs={12} md={4} mb={[3, null, 0]} order={[0, null, 1]}>
            <Grid container spacing={3}>
              <OverviewWidget superChainId={superChainId} walletName={walletName} />
            </Grid>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}

export default CreateSafe
