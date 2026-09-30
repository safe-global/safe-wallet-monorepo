import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { ChangeThresholdFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const RequiredConfirmation = ({ threshold, owners }: { threshold: number; owners: number }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <div className="mt-12">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className="font-bold">
            Required confirmations
          </Typography>
        </div>

        <div className="lg:min-w-0 lg:flex-1">
          <Typography className="pb-4">Any transaction requires the confirmation of:</Typography>

          <Typography className="inline pr-4">
            <b>{threshold}</b> out of <b>{owners}</b> signer{maybePlural(owners)}.
          </Typography>

          {owners > 1 && (
            <CheckWallet>
              {(isOk) => (
                <Track {...SETTINGS_EVENTS.SETUP.CHANGE_THRESHOLD} as="span">
                  <Button onClick={() => setTxFlow(<ChangeThresholdFlow />)} disabled={!isOk} size="sm">
                    Change
                  </Button>
                </Track>
              )}
            </CheckWallet>
          )}
        </div>
      </div>
    </div>
  )
}
