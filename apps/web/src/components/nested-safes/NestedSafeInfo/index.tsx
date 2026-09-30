import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Check } from 'lucide-react'
import type { ReactElement } from 'react'

import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import NestedSafes from '@/public/images/sidebar/nested-safes.svg'
import InfoIcon from '@/public/images/notifications/info.svg'

export function NestedSafeInfo(): ReactElement {
  return (
    <div className="flex flex-col items-center pt-2">
      <NestedSafes />
      <div className="flex gap-2 py-4">
        <Typography variant="paragraph-bold">No Nested Safes yet</Typography>
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <InfoIcon className="size-5 align-middle text-[var(--color-border-main)]" />
              </span>
            }
          />
          <TooltipContent>
            Nested Safes are separate wallets owned by your main Account, perfect for organizing different funds and
            projects.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-4 pb-8 pt-2">
        <div className="flex items-center justify-center rounded-full bg-[var(--color-success-background)] p-5">
          <NestedSafesIcon className="size-5 text-[var(--color-primary-main)]" />
        </div>
        <Typography variant="paragraph-small-bold">Nested Safes allow you to:</Typography>
      </div>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {[
          'rebuild your organizational structure onchain',
          'explore new DeFi opportunities without exposing your main Account',
          'deploy specialized modules and extend Safe functionality',
        ].map((item) => {
          return (
            <li key={item} className="flex items-start gap-6 pl-3">
              <div className="flex size-[25px] shrink-0 items-center justify-center rounded-full bg-[var(--color-success-background)]">
                <Check className="size-4 text-[var(--color-success-main)]" />
              </div>
              <Typography variant="paragraph-small">{item}</Typography>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
