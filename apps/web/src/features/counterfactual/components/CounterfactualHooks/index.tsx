import CounterfactualSuccessScreen from '../CounterfactualSuccessScreen'
import LazyCounterfactual from '../LazyCounterfactual'

// _app.tsx loads this through public/CounterfactualHooks, so its children need no own dynamic().
function CounterfactualHooks() {
  return (
    <>
      <CounterfactualSuccessScreen />
      <LazyCounterfactual />
    </>
  )
}

export default CounterfactualHooks
