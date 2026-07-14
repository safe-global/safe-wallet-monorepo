import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import EthHashInfo from '@/components/common/EthHashInfo'
import LinkIcon from '@/public/images/messages/link.svg'
import css from './styles.module.css'
import InfoBox from '@/components/safe-messages/InfoBox'
import SignedOutState from '../SignedOutState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const UserSettings = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isDarkMode = useDarkMode()

  if (!isUserSignedIn) return <SignedOutState />

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className={css.container}>
        <div className={css.userSettings}>
          <Typography variant="h1" align="center" className="mb-6">
            Manage Wallets
          </Typography>

          <Card size="lg">
            <CardContent>
              <div className="flex flex-col gap-4">
                <Typography variant="h3" className="font-bold">
                  Linked wallets
                </Typography>
                <Typography>
                  A linked wallet allows you to sign in to your Safe Spaces while keeping all your data, such as account
                  names and team members, consistent across all linked wallets.
                </Typography>

                <div>
                  {user?.wallets.map((wallet) => (
                    <div className="flex items-center justify-between gap-4" key={wallet.address}>
                      <EthHashInfo shortAddress={false} address={wallet.address} showCopyButton hasExplorer />
                    </div>
                  ))}
                </div>
                <Tooltip>
                  <TooltipTrigger render={<span className="self-start" />}>
                    <Button variant="ghost" className="p-2" disabled>
                      <LinkIcon className={cn('text-primary', css.linkIcon)} />
                      Link another wallet
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
                <InfoBox
                  title="How to link a wallet?"
                  message={
                    <>
                      <div className="flex flex-col gap-2">
                        {[
                          'Add an address to your profile and confirm with a signature.',
                          'Sign in with the new address and confirm again',
                          'Your wallet now shares the same profile data!',
                        ].map((stepText, index) => (
                          <Typography key={index} className={cn('flex gap-2', css.step)}>
                            <span className={css.stepNumber}>{index + 1}</span>
                            {stepText}
                          </Typography>
                        ))}
                      </div>
                    </>
                  }
                ></InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
