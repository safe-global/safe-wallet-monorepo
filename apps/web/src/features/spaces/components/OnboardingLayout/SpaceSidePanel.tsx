import SafeAppMockup, { type SafeAppMockupProps, type SafeAppMockupAccount } from './SafeAppMockup'

export type { SafeAppMockupAccount }

interface SpaceSidePanelProps {
  name: string
  highlight: SafeAppMockupProps['highlight']
  accounts?: SafeAppMockupAccount[]
}

const SpaceSidePanel = ({ name, highlight, accounts }: SpaceSidePanelProps) => (
  <SafeAppMockup name={name} highlight={highlight} accounts={accounts} />
)

export default SpaceSidePanel
