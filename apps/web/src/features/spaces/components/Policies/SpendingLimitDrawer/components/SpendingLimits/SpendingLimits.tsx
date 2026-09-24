import type { ReactElement } from 'react'
import { DrawerSection } from '@/components/common/Drawer'
import type { PolicySpender } from '../../../types'
import SpenderCard from './SpenderCard'

export type SpendingLimitsProps = {
  spenders: PolicySpender[]
  /** Address book names, resolved by the caller. The real map arrives with the CGW wiring. */
  names?: Record<string, string>
  showUsage: boolean
}

const SpendingLimits = ({ spenders, names, showUsage }: SpendingLimitsProps): ReactElement => (
  <DrawerSection title="Limits">
    <div className="flex flex-col gap-3">
      {spenders.map((spender, index) => (
        <SpenderCard
          key={spender.spender}
          spender={spender}
          label={`Spender ${index + 1}`}
          name={names?.[spender.spender.toLowerCase()]}
          showUsage={showUsage}
        />
      ))}
    </div>
  </DrawerSection>
)

export default SpendingLimits
