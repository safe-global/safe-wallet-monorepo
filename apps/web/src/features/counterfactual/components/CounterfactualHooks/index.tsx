import CounterfactualSuccessScreen from '../CounterfactualSuccessScreen'
import LazyCounterfactual from '../LazyCounterfactual'

/**
 * Global hooks component for counterfactual feature.
 *
 * This component is loaded via useLoadFeature() in _app.tsx, ensuring
 * the entire counterfactual feature is bundled as a single chunk.
 * No need for internal dynamic imports since all components are
 * already in the same feature chunk.
 */
function CounterfactualHooks() {
  return (
    <>
      <CounterfactualSuccessScreen />
      <LazyCounterfactual />
    </>
  )
}

export default CounterfactualHooks
