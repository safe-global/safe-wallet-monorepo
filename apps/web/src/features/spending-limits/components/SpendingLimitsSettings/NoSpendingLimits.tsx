import { Typography } from '@/components/ui/typography'

import BeneficiaryIcon from '@/public/images/settings/spending-limit/beneficiary.svg'
import AssetAmountIcon from '@/public/images/settings/spending-limit/asset-amount.svg'
import TimeIcon from '@/public/images/settings/spending-limit/time.svg'

export const NoSpendingLimits = () => {
  return (
    <div className="mt-4 grid grid-cols-12 gap-4">
      <div className="col-span-2">
        <BeneficiaryIcon data-testid="beneficiary-icon" />
      </div>
      <div className="col-span-10">
        <Typography>
          <b>Select beneficiary</b>
        </Typography>
        <Typography>
          Choose an account that will benefit from this allowance. The beneficiary does not have to be a signer of this
          Safe account
        </Typography>
      </div>
      <div className="col-span-2">
        <AssetAmountIcon data-testid="asset-icon" />
      </div>
      <div className="col-span-10">
        <Typography>
          <b>Select asset and amount</b>
        </Typography>
        <Typography>You can set allowances for any asset stored in your Safe account</Typography>
      </div>
      <div className="col-span-2">
        <TimeIcon data-testid="time-icon" />
      </div>
      <div className="col-span-10">
        <Typography>
          <b>Select time</b>
        </Typography>
        <Typography>
          You can choose to set a one-time allowance or to have it automatically refill after a defined time-period
        </Typography>
      </div>
    </div>
  )
}
