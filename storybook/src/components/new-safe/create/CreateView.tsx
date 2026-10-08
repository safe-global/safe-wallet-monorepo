import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'

export const CREATE_SAFE_STATIC_HINTS: Record<number, CreateSafeInfoItem> = {
  1: {
    title: 'Safe account creation',
    variant: 'info',
    steps: [
      {
        title: 'Network fee',
        text: 'Deploying your Safe account requires the payment of the associated network fee with your connected wallet. An estimation will be provided in the last step.',
      },
      {
        title: 'Address book privacy',
        text: 'The name of your Safe account will be stored in a local address book on your device and can be changed at a later stage. It will not be shared with us or any third party.',
      },
    ],
  },
  2: {
    title: 'Safe account creation',
    variant: 'info',
    steps: [
      {
        title: 'Flat hierarchy',
        text: 'Every signer has the same rights within the Safe account and can propose, sign and execute transactions that have the required confirmations.',
      },
      {
        title: 'Managing Signers',
        text: 'You can always change the number of signers and required confirmations in your Safe account after creation.',
      },
      {
        title: 'Safe account setup',
        text: (
          <>
            Not sure how many signers and confirmations you need for your Safe account?
            <br />
            <ExternalLink href={HelpCenterArticle.SAFE_SETUP} className="font-bold">
              Learn more about setting up your Safe account.
            </ExternalLink>
          </>
        ),
      },
    ],
  },
  3: {
    title: 'Safe account creation',
    variant: 'info',
    steps: [
      {
        title: 'Wait for the creation',
        text: 'Depending on network usage, it can take some time until the transaction is successfully added to the blockchain and picked up by our services.',
      },
    ],
  },
  4: {
    title: 'Safe account usage',
    variant: 'success',
    steps: [
      {
        title: 'Connect your Safe account',
        text: 'In our Safe Apps section you can connect your Safe account to over 70 dApps directly or via Wallet Connect to interact with any application.',
      },
    ],
  },
}

export type CreateViewProps = {
  stepper: ReactNode
  showOverview: boolean
  overviewWidget: ReactNode
  walletAddress?: string
  createSafeInfos: ReactNode
}

export function CreateView({
  stepper,
  showOverview,
  overviewWidget,
  walletAddress,
  createSafeInfos,
}: CreateViewProps): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
      <div className="grid grid-cols-12 justify-center gap-x-6">
        <div className="col-span-12">
          <Typography variant="h2" className="pb-4">
            Create new Safe account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-8">{stepper}</div>

        <div className="order-0 col-span-12 mb-6 md:order-1 md:col-span-4 md:mb-0">
          <div className="grid grid-cols-12 gap-6">
            {showOverview && overviewWidget}
            {walletAddress && createSafeInfos}
          </div>
        </div>
      </div>
    </div>
  )
}
