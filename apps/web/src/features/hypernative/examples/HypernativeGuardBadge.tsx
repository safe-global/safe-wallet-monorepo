/**
 * Example components showing how to use useIsHypernativeGuard hook
 * These are demo components showing various usage patterns
 *
 * HypernativeGuard uses the same bytecode across all chains,
 * so no chain-specific logic is needed
 */

import { useIsHypernativeGuard } from '../hooks'
import { Box, Chip, CircularProgress } from '@mui/material'

/**
 * Example badge component that displays HypernativeGuard status
 */
export const HypernativeGuardBadge = () => {
  const { isHypernativeGuard, loading } = useIsHypernativeGuard()

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <span>Checking guard...</span>
      </Box>
    )
  }

  if (!isHypernativeGuard) {
    return null // Don't show anything if not a HypernativeGuard
  }

  return (
    <Chip
      label="Protected by Hypernative"
      color="success"
      size="small"
      icon={<>🛡️</>}
    />
  )
}

/**
 * Example usage in a conditional render
 */
export const ConditionalHypernativeFeature = () => {
  const { isHypernativeGuard, loading } = useIsHypernativeGuard()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {isHypernativeGuard ? (
        <div>
          <h3>Hypernative Guard Settings</h3>
          <p>Configure your Hypernative security policies here.</p>
          {/* Additional HypernativeGuard-specific UI */}
        </div>
      ) : (
        <div>
          <h3>Enhance Your Security</h3>
          <p>Install Hypernative Guard to add advanced transaction monitoring.</p>
          <button>Install Hypernative Guard</button>
        </div>
      )}
    </div>
  )
}

/**
 * Example usage in useEffect for side effects
 */
export const HypernativeAnalytics = () => {
  const { isHypernativeGuard } = useIsHypernativeGuard()

  // Track when a Safe with HypernativeGuard is loaded
  // useEffect(() => {
  //   if (isHypernativeGuard) {
  //     // Track analytics event
  //     console.log('Safe with HypernativeGuard detected')
  //   }
  // }, [isHypernativeGuard])

  return null // This is an analytics-only component
}
