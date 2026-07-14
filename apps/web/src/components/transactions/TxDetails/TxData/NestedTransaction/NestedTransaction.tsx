import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

import { Divider } from '@/components/tx/ColorCodedTxAccordion'

import NestedTransactionIcon from '@/public/images/transactions/nestedTx.svg'
import { type ReactElement } from 'react'
import MethodCall from '../DecodedData/MethodCall'
import { MethodDetails } from '../DecodedData/MethodDetails'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { MODALS_EVENTS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { useSignedHash } from './useSignedHash'
import { useCurrentChain } from '@/hooks/useChains'

export const NestedTransaction = ({
  txData,
  children,
  isConfirmationView = false,
}: {
  txData: TransactionData | null | undefined
  children: ReactElement
  isConfirmationView?: boolean
}) => {
  const chain = useCurrentChain()
  const signedHash = useSignedHash(txData)
  return (
    <div className="flex flex-col gap-4">
      {!isConfirmationView && txData?.dataDecoded && (
        <>
          <MethodCall contractAddress={txData.to.value} method={txData.dataDecoded.method} />
          <MethodDetails data={txData.dataDecoded} addressInfoIndex={txData.addressInfoIndex} />
          <Divider />
        </>
      )}

      {/* eslint-disable-next-line no-restricted-syntax -- nested-tx card sits on the page (main) surface; nested-surface token, pending a `surface` variant */}
      <Card variant="outlined" size="none" radius="lg" className="bg-[var(--color-background-main)]">
        <div className="border-border-light flex items-center gap-4 border-b p-4">
          <NestedTransactionIcon className="size-4" />
          <Typography variant="h4" className="grow">
            Nested transaction
          </Typography>
          {chain && txData && signedHash && (
            <Track {...MODALS_EVENTS.OPEN_NESTED_TX}>
              <Link
                href={{
                  pathname: AppRoutes.transactions.tx,
                  query: {
                    safe: `${chain?.shortName}:${txData.to.value}`,
                    id: signedHash,
                  },
                }}
                passHref
                legacyBehavior
              >
                <ExternalLink className="text-muted-foreground">
                  <Typography variant="paragraph-small-bold">Open</Typography>
                </ExternalLink>
              </Link>
            </Track>
          )}
        </div>
        <CardContent>
          <div className="flex flex-col gap-8 p-4">{children}</div>
        </CardContent>
      </Card>
    </div>
  )
}
