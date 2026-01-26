import CounterfactualSuccessScreen from '../CounterfactualSuccessScreen'
import dynamic from 'next/dynamic'

const LazyCounterfactual = dynamic(() => import('../LazyCounterfactual'))

function CounterfactualHooks() {
  return (
    <>
      <CounterfactualSuccessScreen />
      <LazyCounterfactual />
    </>
  )
}

export default CounterfactualHooks
