import dynamic from 'next/dynamic'

export type { TransactionHash, TrezorHashState, ShowHashFunction, HideHashFunction } from './types'

export { showTrezorHashComparison, hideTrezorHashComparison } from './store'

const TrezorHashComparison = dynamic(
  () => import('./components/TrezorHashComparison').then((mod) => ({ default: mod.default })),
  { ssr: false },
)

export default TrezorHashComparison
