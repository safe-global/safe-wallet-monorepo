import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'

export type SetupViewProps = {
  safeLoaded: boolean
  nonce: number
  contractVersion: ReactNode
  ownerList: ReactNode
  proposersList: ReactNode
  requiredConfirmation: ReactNode
  children: ReactNode
}

export const SetupView = ({
  safeLoaded,
  nonce,
  contractVersion,
  ownerList,
  proposersList,
  requiredConfirmation,
  children,
}: SetupViewProps) => {
  return (
    <main>
      <div data-testid="setup-section" className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div className="lg:w-1/5 lg:shrink-0">
            <Typography variant="h4" className="font-bold">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span>
                      Safe account nonce
                      <InfoIcon className="ml-1 inline size-5 align-middle text-[var(--color-border-main)]" />
                    </span>
                  }
                />
                <TooltipContent>
                  For security reasons, transactions made with a Safe account need to be executed in order. The nonce
                  shows you which transaction will be executed next. You can find the nonce for a transaction in the
                  transaction details.
                </TooltipContent>
              </Tooltip>
            </Typography>

            {/* as="div": the Skeleton renders a div, which is invalid inside the default <p> */}
            <Typography as="div" className="pt-2">
              Current nonce: {safeLoaded ? <b>{nonce}</b> : <Skeleton className="inline-block h-4 w-[30px]" />}
            </Typography>
          </div>

          <div className="lg:min-w-0 lg:flex-1">{contractVersion}</div>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div className="lg:w-1/5 lg:shrink-0">
            <Typography variant="h4" className="font-bold">
              Members
            </Typography>
          </div>

          <div className="lg:min-w-0 lg:flex-1">
            <div className="flex flex-col gap-4">
              {ownerList}
              {proposersList}
            </div>
          </div>
        </div>

        {requiredConfirmation}
      </div>

      {children}
    </main>
  )
}
