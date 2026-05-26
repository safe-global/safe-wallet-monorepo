import SafeAppMockup from './SafeAppMockup'
import type { SafeAppMockupAccount, SafeAppMockupProps } from './mockup/types'
import type { SafeItem } from '@/hooks/safes'

export type { SafeAppMockupAccount }

interface SpaceSidePanelProps {
  name: string
  highlight: SafeAppMockupProps['highlight']
  accounts?: SafeAppMockupAccount[]
  balanceSafes?: SafeItem[]
}

const SpaceSidePanel = ({ name, highlight, accounts, balanceSafes }: SpaceSidePanelProps) => (
  <SafeAppMockup name={name} highlight={highlight} accounts={accounts} balanceSafes={balanceSafes} />
)

export default SpaceSidePanel
