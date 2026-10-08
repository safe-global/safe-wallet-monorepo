import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'

export type NestedSafeCreationViewProps = {
  address: string
  name?: string
}

export function NestedSafeCreationView({ address, name }: NestedSafeCreationViewProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="paragraph-small" className="text-muted-foreground whitespace-nowrap">
        Nested Safe
      </Typography>

      <div>
        <EthHashInfo name={name} address={address} shortAddress={false} hasExplorer showCopyButton showAvatar />
      </div>
    </div>
  )
}
