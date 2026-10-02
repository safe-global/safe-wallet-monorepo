import type { ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { DrawerSection } from '@/components/common/Drawer'
import type { PolicySpender } from '../../../types'
import SpenderCard from './SpenderCard'

export type SpendingLimitsProps = {
  spenders: PolicySpender[]
  /** Address book names keyed by address, in any casing. The real map arrives with the CGW wiring. */
  names?: Record<string, string>
  showUsage: boolean
}

/** Address-keyed, but a checksummed key must not miss a lowercased address, or every spender goes anonymous. */
const findName = (names: SpendingLimitsProps['names'], address: string): string | undefined =>
  Object.entries(names ?? {}).find(([key]) => sameAddress(key, address))?.[1]

const SpendingLimits = ({ spenders, names, showUsage }: SpendingLimitsProps): ReactElement => (
  <DrawerSection title="Limits">
    <div className="flex flex-col gap-3">
      {spenders.map((spender, index) => (
        <SpenderCard
          key={spender.spender}
          spender={spender}
          label={`Spender ${index + 1}`}
          name={findName(names, spender.spender)}
          showUsage={showUsage}
        />
      ))}
    </div>
  </DrawerSection>
)

export default SpendingLimits
