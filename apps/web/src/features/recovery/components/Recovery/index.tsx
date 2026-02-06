import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '../../hooks/useIsRecoverySupported'

// Lazy load the heavy recovery components to keep them out of the main bundle
// This includes RecoveryContextHooks which imports @gnosis.pm/zodiac
const LazyRecoveryContent = dynamic(() => import('./RecoveryContent'))

function Recovery() {
  const isSupported = useIsRecoverySupported()
  return isSupported ? <LazyRecoveryContent /> : null
}

export default Recovery
