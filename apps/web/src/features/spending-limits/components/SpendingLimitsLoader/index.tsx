import { useLoadSpendingLimits } from '../../hooks/useSpendingLimits'

/**
 * Global component that loads spending limits data on app start.
 * Renders null - only used for its side effect of loading data.
 *
 * This component should be rendered once globally (e.g., in _app.tsx).
 * It loads spending limits data as soon as a Safe is loaded, making the
 * data available to all components that need it.
 */
const SpendingLimitsLoader = () => {
  // Load spending limits data on mount
  useLoadSpendingLimits()

  return null
}

export default SpendingLimitsLoader
